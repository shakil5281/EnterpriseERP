using Erp.BuildingBlocks.EventBus;
using LeaveService.Application.Common.Exceptions;
using LeaveService.Application.Common.Interfaces;
using LeaveService.Contracts.LeaveApplications;
using LeaveService.Domain.Entities;
using MediatR;

using Erp.BuildingBlocks.SharedKernel;

namespace LeaveService.Application.Features.LeaveApplications;

public sealed record ApplyLeaveCommand(ApplyLeaveRequest Request) : IRequest<LeaveApplicationDto>;

public sealed record ListLeaveApplicationsQuery(Guid CompanyId) : IRequest<IReadOnlyList<LeaveApplicationDto>>;

public sealed record GetLeaveApplicationByIdQuery(Guid Id) : IRequest<LeaveApplicationDto?>;

public sealed record ApproveLeaveCommand(ApproveLeaveRequest Request) : IRequest<LeaveApplicationDto>;

public sealed record RejectLeaveCommand(RejectLeaveRequest Request) : IRequest<LeaveApplicationDto>;

public sealed record CancelLeaveCommand(CancelLeaveRequest Request) : IRequest<LeaveApplicationDto>;

public sealed class ApplyLeaveCommandHandler(
    ILeaveUnitOfWork uow,
    IEmployeeServiceClient employees,
    ILeaveDayCalculator calculator,
    ILeaveBalanceService balances,
    ILeaveAuditService audit,
    IIntegrationMessagePublisher bus,
    INotificationServiceClient notifications) : IRequestHandler<ApplyLeaveCommand, LeaveApplicationDto>
{
    public async Task<LeaveApplicationDto> Handle(ApplyLeaveCommand cmd, CancellationToken cancellationToken)
    {
        var r = cmd.Request;
        if (!await employees.IsEmployeeActiveAsync(r.CompanyId, r.EmployeeId, cancellationToken))
        {
            throw new LeaveBusinessException("Inactive employee cannot apply leave.");
        }

        var leaveType = await uow.LeaveTypes.GetByIdAsync(r.LeaveTypeId, cancellationToken)
                        ?? throw new LeaveBusinessException("Leave type not found.");
        if (leaveType.CompanyId != r.CompanyId)
        {
            throw new LeaveBusinessException("Leave type does not belong to company.");
        }

        if (!leaveType.IsActive)
        {
            throw new LeaveBusinessException("Inactive leave type cannot be used.");
        }

        var policy = await uow.LeavePolicies.GetActiveByCompanyAndLeaveTypeAsync(r.CompanyId, r.LeaveTypeId, cancellationToken);

        if (await uow.LeaveApplications.HasOverlappingPendingOrApprovedAsync(r.CompanyId, r.EmployeeId, r.FromDate, r.ToDate, null, cancellationToken))
        {
            throw new LeaveBusinessException("Leave dates overlap with existing pending or approved leave.");
        }

        var totalDays = await calculator.CalculateLeaveDaysAsync(r.CompanyId, r.LeaveTypeId, r.FromDate, r.ToDate, r.IsHalfDay, cancellationToken);
        if (totalDays <= 0)
        {
            throw new LeaveBusinessException("Calculated leave duration must be greater than zero.");
        }

        if (policy?.MaxConsecutiveDays is { } max && totalDays > max)
        {
            throw new LeaveBusinessException($"Leave exceeds maximum consecutive days ({max}).");
        }

        var yearNo = r.FromDate.Year;
        if (leaveType.IsPaid)
        {
            var balance = await uow.EmployeeLeaveBalances.GetAsync(r.CompanyId, r.EmployeeId, r.LeaveTypeId, yearNo, cancellationToken)
                          ?? throw new LeaveBusinessException("Leave balance row not found for employee.");
            var available = balance.BalanceDays - balance.PendingDays;
            if (!policy!.AllowNegativeBalance && available < totalDays)
            {
                throw new LeaveBusinessException("Insufficient leave balance.");
            }
        }

        var requiresApproval = policy?.RequiresApproval ?? true;
        var app = new LeaveApplication
        {
            Id = Guid.NewGuid(),
            CompanyId = r.CompanyId,
            EmployeeId = r.EmployeeId,
            LeaveTypeId = r.LeaveTypeId,
            FromDate = r.FromDate,
            ToDate = r.ToDate,
            TotalDays = totalDays,
            IsHalfDay = r.IsHalfDay,
            HalfDayType = r.HalfDayType,
            Reason = r.Reason,
            Status = requiresApproval ? "Pending" : "Approved",
            AppliedBy = r.AppliedBy,
            AppliedAt = BusinessTime.Now,
            ApprovedAt = requiresApproval ? null : BusinessTime.Now,
            AttachmentUrl = r.AttachmentUrl,
        };

        uow.LeaveApplications.Add(app);

        if (requiresApproval)
        {
            var levelCount = Math.Max(1, policy?.ApprovalLevelCount ?? 1);
            var seeds = r.ApprovalSteps?.ToDictionary(x => x.ApprovalLevel);
            for (var level = 1; level <= levelCount; level++)
            {
                ApprovalStepSeedDto? seed = null;
                if (seeds != null && seeds.TryGetValue(level, out var s))
                {
                    seed = s;
                }

                uow.LeaveApprovalSteps.AddRange(new[]
                {
                    new LeaveApprovalStep
                    {
                        Id = Guid.NewGuid(),
                        LeaveApplicationId = app.Id,
                        ApprovalLevel = level,
                        ApproverUserId = seed?.ApproverUserId,
                        ApproverEmployeeId = seed?.ApproverEmployeeId,
                        Status = "Pending",
                    },
                });
            }

            await balances.ApplyPendingAsync(r.CompanyId, r.EmployeeId, r.LeaveTypeId, yearNo, totalDays, cancellationToken);
            uow.LeaveTransactions.Add(new LeaveTransaction
            {
                Id = Guid.NewGuid(),
                CompanyId = r.CompanyId,
                EmployeeId = r.EmployeeId,
                LeaveTypeId = r.LeaveTypeId,
                LeaveApplicationId = app.Id,
                TransactionDate = BusinessTime.Now,
                TransactionType = "Apply",
                Days = totalDays,
                YearNo = yearNo,
                Remarks = "Leave applied",
            });
        }
        else
        {
            app.ApprovedAt = BusinessTime.Now;
            await balances.RecordDirectApprovalAsync(r.CompanyId, r.EmployeeId, r.LeaveTypeId, yearNo, totalDays, cancellationToken);
            uow.LeaveTransactions.Add(new LeaveTransaction
            {
                Id = Guid.NewGuid(),
                CompanyId = r.CompanyId,
                EmployeeId = r.EmployeeId,
                LeaveTypeId = r.LeaveTypeId,
                LeaveApplicationId = app.Id,
                TransactionDate = BusinessTime.Now,
                TransactionType = "Approve",
                Days = totalDays,
                YearNo = yearNo,
                Remarks = "Auto-approved (no approval required)",
            });
        }

        await audit.WriteAsync(r.CompanyId, r.AppliedBy, "LeaveApplied", nameof(LeaveApplication), app.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);

        await bus.PublishJsonAsync(EventTypes.LeaveApplied, new
        {
            eventName = "LeaveApplied",
            companyId = r.CompanyId,
            employeeId = r.EmployeeId,
            leaveTypeId = r.LeaveTypeId,
            leaveApplicationId = app.Id,
            fromDate = r.FromDate.ToString("yyyy-MM-dd"),
            toDate = r.ToDate.ToString("yyyy-MM-dd"),
            totalDays,
            isPaid = leaveType.IsPaid,
        }, cancellationToken);

        if (requiresApproval)
        {
            var first = await uow.LeaveApplications.GetWithStepsAsync(app.Id, cancellationToken);
            var step = first?.ApprovalSteps.OrderBy(s => s.ApprovalLevel).FirstOrDefault(s => s.ApproverUserId.HasValue);
            if (step?.ApproverUserId is { } uid)
            {
                await notifications.SendLeaveApprovalNotificationAsync(uid, app.Id, cancellationToken);
            }
        }

        var result = await uow.LeaveApplications.GetWithStepsAsync(app.Id, cancellationToken);
        return LeaveApplicationDtoFactory.FromEntity(result!);
    }
}

public sealed class ListLeaveApplicationsQueryHandler(ILeaveUnitOfWork uow) : IRequestHandler<ListLeaveApplicationsQuery, IReadOnlyList<LeaveApplicationDto>>
{
    public async Task<IReadOnlyList<LeaveApplicationDto>> Handle(ListLeaveApplicationsQuery request, CancellationToken cancellationToken)
    {
        var list = await uow.LeaveApplications.ListByCompanyAsync(request.CompanyId, cancellationToken);
        return list.Select(a => new LeaveApplicationDto(a.Id, a.CompanyId, a.EmployeeId, a.LeaveTypeId, a.LeaveType?.LeaveCode, a.FromDate, a.ToDate, a.TotalDays, a.IsHalfDay, a.HalfDayType, a.Reason, a.Status, a.AppliedBy, a.AppliedAt, a.ApprovedAt, a.RejectedAt, a.CancelledAt, Array.Empty<LeaveApprovalStepDto>())).ToList();
    }
}

public sealed class GetLeaveApplicationByIdQueryHandler(ILeaveUnitOfWork uow) : IRequestHandler<GetLeaveApplicationByIdQuery, LeaveApplicationDto?>
{
    public async Task<LeaveApplicationDto?> Handle(GetLeaveApplicationByIdQuery request, CancellationToken cancellationToken)
    {
        var a = await uow.LeaveApplications.GetWithStepsAsync(request.Id, cancellationToken);
        return a == null ? null : LeaveApplicationDtoFactory.FromEntity(a);
    }

}

public sealed class ApproveLeaveCommandHandler(
    ILeaveUnitOfWork uow,
    ILeaveBalanceService balances,
    IPayrollGate payrollGate,
    ILeaveAuditService audit,
    IIntegrationMessagePublisher bus) : IRequestHandler<ApproveLeaveCommand, LeaveApplicationDto>
{
    public async Task<LeaveApplicationDto> Handle(ApproveLeaveCommand cmd, CancellationToken cancellationToken)
    {
        var r = cmd.Request;
        var app = await uow.LeaveApplications.GetWithStepsAsync(r.LeaveApplicationId, cancellationToken)
                  ?? throw new LeaveBusinessException("Leave application not found.");
        if (app.Status is not "Pending")
        {
            throw new LeaveBusinessException("Only pending applications can be approved.");
        }

        await payrollGate.EnsureUnlockedForPeriodAsync(app.CompanyId, app.FromDate, app.ToDate, cancellationToken);

        var leaveType = await uow.LeaveTypes.GetByIdAsync(app.LeaveTypeId, cancellationToken)
                        ?? throw new LeaveBusinessException("Leave type missing.");
        if (leaveType.IsPaid)
        {
            var policy = await uow.LeavePolicies.GetActiveByCompanyAndLeaveTypeAsync(app.CompanyId, app.LeaveTypeId, cancellationToken);
            var yearNo = app.FromDate.Year;
            var balance = await uow.EmployeeLeaveBalances.GetAsync(app.CompanyId, app.EmployeeId, app.LeaveTypeId, yearNo, cancellationToken)
                          ?? throw new LeaveBusinessException("Balance row missing.");
            var available = balance.BalanceDays - balance.PendingDays;
            if (policy is { AllowNegativeBalance: false } && available < app.TotalDays)
            {
                throw new LeaveBusinessException("Insufficient leave balance for approval.");
            }
        }

        var ordered = app.ApprovalSteps.OrderBy(s => s.ApprovalLevel).ToList();
        var current = ordered.FirstOrDefault(s => s.Status == "Pending")
                      ?? throw new LeaveBusinessException("No pending approval step.");

        if (r.ApproverUserId.HasValue && current.ApproverUserId.HasValue && current.ApproverUserId != r.ApproverUserId)
        {
            throw new LeaveBusinessException("Approver is not valid for the current step.");
        }

        current.Status = "Approved";
        current.ActionAt = BusinessTime.Now;
        current.ApproverUserId ??= r.ApproverUserId;

        var morePending = ordered.Any(s => s.Status == "Pending");
        if (morePending)
        {
            await audit.WriteAsync(app.CompanyId, r.ApprovedBy, "LeaveApprovalStepApproved", nameof(LeaveApplication), app.Id, $"Level {current.ApprovalLevel}", cancellationToken);
            await uow.SaveChangesAsync(cancellationToken);
            var reloaded = await uow.LeaveApplications.GetWithStepsAsync(app.Id, cancellationToken);
            return LeaveApplicationDtoFactory.FromEntity(reloaded!);
        }

        app.Status = "Approved";
        app.ApprovedAt = BusinessTime.Now;
        var y = app.FromDate.Year;
        await balances.FinalizeApprovalAsync(app.CompanyId, app.EmployeeId, app.LeaveTypeId, y, app.TotalDays, cancellationToken);
        uow.LeaveTransactions.Add(new LeaveTransaction
        {
            Id = Guid.NewGuid(),
            CompanyId = app.CompanyId,
            EmployeeId = app.EmployeeId,
            LeaveTypeId = app.LeaveTypeId,
            LeaveApplicationId = app.Id,
            TransactionDate = BusinessTime.Now,
            TransactionType = "Approve",
            Days = app.TotalDays,
            YearNo = y,
            Remarks = "Final approval",
        });
        await audit.WriteAsync(app.CompanyId, r.ApprovedBy, "LeaveApproved", nameof(LeaveApplication), app.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);

        await bus.PublishJsonAsync(EventTypes.LeaveApproved, new
        {
            eventName = "LeaveApproved",
            companyId = app.CompanyId,
            employeeId = app.EmployeeId,
            leaveTypeId = app.LeaveTypeId,
            fromDate = app.FromDate.ToString("yyyy-MM-dd"),
            toDate = app.ToDate.ToString("yyyy-MM-dd"),
            totalDays = app.TotalDays,
            isPaid = leaveType.IsPaid,
        }, cancellationToken);

        var final = await uow.LeaveApplications.GetWithStepsAsync(app.Id, cancellationToken);
        return LeaveApplicationDtoFactory.FromEntity(final!);
    }
}

public sealed class RejectLeaveCommandHandler(
    ILeaveUnitOfWork uow,
    ILeaveBalanceService balances,
    ILeaveAuditService audit,
    IIntegrationMessagePublisher bus) : IRequestHandler<RejectLeaveCommand, LeaveApplicationDto>
{
    public async Task<LeaveApplicationDto> Handle(RejectLeaveCommand cmd, CancellationToken cancellationToken)
    {
        var r = cmd.Request;
        var app = await uow.LeaveApplications.GetWithStepsAsync(r.LeaveApplicationId, cancellationToken)
                  ?? throw new LeaveBusinessException("Leave application not found.");
        if (app.Status is not "Pending")
        {
            throw new LeaveBusinessException("Only pending applications can be rejected.");
        }

        foreach (var s in app.ApprovalSteps)
        {
            if (s.Status == "Pending")
            {
                s.Status = "Rejected";
                s.Remarks = r.Remarks;
                s.ActionAt = BusinessTime.Now;
                s.ApproverUserId ??= r.RejectedBy;
            }
        }

        app.Status = "Rejected";
        app.RejectedAt = BusinessTime.Now;
        var y = app.FromDate.Year;
        await balances.ReleasePendingAsync(app.CompanyId, app.EmployeeId, app.LeaveTypeId, y, app.TotalDays, cancellationToken);
        uow.LeaveTransactions.Add(new LeaveTransaction
        {
            Id = Guid.NewGuid(),
            CompanyId = app.CompanyId,
            EmployeeId = app.EmployeeId,
            LeaveTypeId = app.LeaveTypeId,
            LeaveApplicationId = app.Id,
            TransactionDate = BusinessTime.Now,
            TransactionType = "Reject",
            Days = app.TotalDays,
            YearNo = y,
            Remarks = r.Remarks,
        });
        await audit.WriteAsync(app.CompanyId, r.RejectedBy, "LeaveRejected", nameof(LeaveApplication), app.Id, r.Remarks, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await bus.PublishJsonAsync(EventTypes.LeaveRejected, new { eventName = "LeaveRejected", companyId = app.CompanyId, employeeId = app.EmployeeId, leaveApplicationId = app.Id }, cancellationToken);
        var reloaded = await uow.LeaveApplications.GetWithStepsAsync(app.Id, cancellationToken);
        return LeaveApplicationDtoFactory.FromEntity(reloaded!);
    }
}

public sealed class CancelLeaveCommandHandler(
    ILeaveUnitOfWork uow,
    ILeaveBalanceService balances,
    IPayrollGate payrollGate,
    ILeaveAuditService audit,
    IIntegrationMessagePublisher bus) : IRequestHandler<CancelLeaveCommand, LeaveApplicationDto>
{
    public async Task<LeaveApplicationDto> Handle(CancelLeaveCommand cmd, CancellationToken cancellationToken)
    {
        var r = cmd.Request;
        var app = await uow.LeaveApplications.GetWithStepsAsync(r.LeaveApplicationId, cancellationToken)
                  ?? throw new LeaveBusinessException("Leave application not found.");
        if (app.Status is "Cancelled" or "Rejected")
        {
            throw new LeaveBusinessException("Leave cannot be cancelled.");
        }

        await payrollGate.EnsureUnlockedForPeriodAsync(app.CompanyId, app.FromDate, app.ToDate, cancellationToken);

        var y = app.FromDate.Year;
        if (app.Status == "Pending")
        {
            await balances.ReleasePendingAsync(app.CompanyId, app.EmployeeId, app.LeaveTypeId, y, app.TotalDays, cancellationToken);
        }
        else if (app.Status == "Approved")
        {
            await balances.RestoreApprovedAsync(app.CompanyId, app.EmployeeId, app.LeaveTypeId, y, app.TotalDays, cancellationToken);
        }

        app.Status = "Cancelled";
        app.CancelledAt = BusinessTime.Now;
        uow.LeaveTransactions.Add(new LeaveTransaction
        {
            Id = Guid.NewGuid(),
            CompanyId = app.CompanyId,
            EmployeeId = app.EmployeeId,
            LeaveTypeId = app.LeaveTypeId,
            LeaveApplicationId = app.Id,
            TransactionDate = BusinessTime.Now,
            TransactionType = "Cancel",
            Days = app.TotalDays,
            YearNo = y,
            Remarks = "Cancelled",
        });
        await audit.WriteAsync(app.CompanyId, r.CancelledBy, "LeaveCancelled", nameof(LeaveApplication), app.Id, null, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await bus.PublishJsonAsync(EventTypes.LeaveCancelled, new { eventName = "LeaveCancelled", companyId = app.CompanyId, employeeId = app.EmployeeId, leaveApplicationId = app.Id }, cancellationToken);
        var reloaded = await uow.LeaveApplications.GetWithStepsAsync(app.Id, cancellationToken);
        return LeaveApplicationDtoFactory.FromEntity(reloaded!);
    }
}
