using MediatR;
using PayrollService.Contracts;
using PayrollService.Domain.Entities;

namespace PayrollService.Application.Handlers;

public sealed class PayrollPeriodHandlers(IPayrollDbContext db, IIntegrationEventPublisher publisher) :
    IRequestHandler<CreatePayrollPeriodCommand, ApiResponse<PayrollPeriodDto>>,
    IRequestHandler<GetPayrollPeriodQuery, ApiResponse<IReadOnlyList<PayrollPeriodDto>>>,
    IRequestHandler<SubmitPayrollCommand, ApiResponse<PayrollPeriodDto>>,
    IRequestHandler<ApprovePayrollCommand, ApiResponse<PayrollPeriodDto>>,
    IRequestHandler<RejectPayrollCommand, ApiResponse<PayrollPeriodDto>>,
    IRequestHandler<LockPayrollCommand, ApiResponse<PayrollPeriodDto>>,
    IRequestHandler<UnlockPayrollCommand, ApiResponse<PayrollPeriodDto>>,
    IRequestHandler<CheckPayrollLockQuery, ApiResponse<PayrollLockCheckDto>>
{
    public async Task<ApiResponse<PayrollPeriodDto>> Handle(CreatePayrollPeriodCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        if (db.PayrollPeriods.Any(x => x.CompanyId == r.CompanyId && x.YearNo == r.YearNo && x.MonthNo == r.MonthNo))
        {
            return ApiResponse<PayrollPeriodDto>.Fail("Payroll period already exists.");
        }

        var period = new PayrollPeriod { CompanyId = r.CompanyId, YearNo = r.YearNo, MonthNo = r.MonthNo, StartDate = r.StartDate, EndDate = r.EndDate };
        db.Add(period);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<PayrollPeriodDto>.Ok(period.ToDto(), "Payroll period created.");
    }

    public Task<ApiResponse<IReadOnlyList<PayrollPeriodDto>>> Handle(GetPayrollPeriodQuery query, CancellationToken cancellationToken)
    {
        var result = db.PayrollPeriods
            .Where(x => (!query.Id.HasValue || x.Id == query.Id) && (!query.CompanyId.HasValue || x.CompanyId == query.CompanyId))
            .OrderByDescending(x => x.YearNo).ThenByDescending(x => x.MonthNo)
            .Select(x => x.ToDto())
            .ToList();
        return Task.FromResult(ApiResponse<IReadOnlyList<PayrollPeriodDto>>.Ok(result));
    }

    public async Task<ApiResponse<PayrollPeriodDto>> Handle(SubmitPayrollCommand command, CancellationToken cancellationToken)
    {
        var period = db.PayrollPeriods.FirstOrDefault(x => x.Id == command.PayrollPeriodId);
        if (period is null) return ApiResponse<PayrollPeriodDto>.Fail("Payroll period not found.");
        if (period.IsPayrollLocked) return ApiResponse<PayrollPeriodDto>.Fail("Payroll period is locked.");
        period.Status = "Submitted";
        db.Add(new PayrollApproval { CompanyId = period.CompanyId, PayrollPeriodId = period.Id, ApprovalLevel = 1 });
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<PayrollPeriodDto>.Ok(period.ToDto(), "Payroll submitted.");
    }

    public async Task<ApiResponse<PayrollPeriodDto>> Handle(ApprovePayrollCommand command, CancellationToken cancellationToken)
    {
        var period = db.PayrollPeriods.FirstOrDefault(x => x.Id == command.PayrollPeriodId);
        if (period is null) return ApiResponse<PayrollPeriodDto>.Fail("Payroll period not found.");
        if (period.IsPayrollLocked) return ApiResponse<PayrollPeriodDto>.Fail("Payroll period is locked.");
        var wasAlreadyApproved = period.Status == "Approved";

        period.Status = "Approved";
        foreach (var payroll in db.EmployeePayrolls.Where(x => x.PayrollPeriodId == period.Id))
        {
            payroll.Status = "Approved";
        }

        foreach (var approval in db.PayrollApprovals.Where(x => x.PayrollPeriodId == period.Id && x.ApprovalStatus == "Pending"))
        {
            approval.ApprovalStatus = "Approved";
            approval.ApprovedBy = command.ApprovedBy;
            approval.ApprovedAt = DateTime.UtcNow;
            approval.Remarks = command.Remarks;
        }

        if (!wasAlreadyApproved)
        {
            ApplyAdvanceBalances(period);
        }
        await db.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new PayrollApprovedEvent(period.CompanyId, period.YearNo, period.MonthNo, period.Id, DateTime.UtcNow), cancellationToken);
        return ApiResponse<PayrollPeriodDto>.Ok(period.ToDto(), "Payroll approved.");
    }

    public async Task<ApiResponse<PayrollPeriodDto>> Handle(RejectPayrollCommand command, CancellationToken cancellationToken)
    {
        var period = db.PayrollPeriods.FirstOrDefault(x => x.Id == command.PayrollPeriodId);
        if (period is null) return ApiResponse<PayrollPeriodDto>.Fail("Payroll period not found.");
        if (period.IsPayrollLocked) return ApiResponse<PayrollPeriodDto>.Fail("Payroll period is locked.");
        period.Status = "Rejected";
        foreach (var approval in db.PayrollApprovals.Where(x => x.PayrollPeriodId == period.Id && x.ApprovalStatus == "Pending"))
        {
            approval.ApprovalStatus = "Rejected";
            approval.RejectedBy = command.RejectedBy;
            approval.RejectedAt = DateTime.UtcNow;
            approval.Remarks = command.Remarks;
        }

        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<PayrollPeriodDto>.Ok(period.ToDto(), "Payroll rejected.");
    }

    public async Task<ApiResponse<PayrollPeriodDto>> Handle(LockPayrollCommand command, CancellationToken cancellationToken)
    {
        var period = db.PayrollPeriods.FirstOrDefault(x => x.Id == command.PayrollPeriodId);
        if (period is null) return ApiResponse<PayrollPeriodDto>.Fail("Payroll period not found.");
        period.Status = "Locked";
        period.IsPayrollLocked = true;
        db.Add(new PayrollLock { CompanyId = period.CompanyId, PayrollPeriodId = period.Id, LockedBy = command.LockedBy });
        db.Add(new PayrollAuditLog { CompanyId = period.CompanyId, EntityName = nameof(PayrollPeriod), EntityId = period.Id, Action = "Locked", ActorId = command.LockedBy, Remarks = command.Remarks });
        await db.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new PayrollLockedEvent(period.CompanyId, period.YearNo, period.MonthNo, period.Id, DateTime.UtcNow), cancellationToken);
        return ApiResponse<PayrollPeriodDto>.Ok(period.ToDto(), "Payroll locked.");
    }

    public async Task<ApiResponse<PayrollPeriodDto>> Handle(UnlockPayrollCommand command, CancellationToken cancellationToken)
    {
        var period = db.PayrollPeriods.FirstOrDefault(x => x.Id == command.PayrollPeriodId);
        if (period is null) return ApiResponse<PayrollPeriodDto>.Fail("Payroll period not found.");
        period.Status = "Approved";
        period.IsPayrollLocked = false;
        var lockRow = db.PayrollLocks.Where(x => x.PayrollPeriodId == period.Id && x.IsLocked).OrderByDescending(x => x.LockedAt).FirstOrDefault();
        if (lockRow is not null)
        {
            lockRow.IsLocked = false;
            lockRow.UnlockedBy = command.UnlockedBy;
            lockRow.UnlockedAt = DateTime.UtcNow;
            lockRow.UnlockReason = command.UnlockReason;
        }

        db.Add(new PayrollAuditLog { CompanyId = period.CompanyId, EntityName = nameof(PayrollPeriod), EntityId = period.Id, Action = "Unlocked", ActorId = command.UnlockedBy, Remarks = command.UnlockReason });
        await db.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new PayrollUnlockedEvent(period.CompanyId, period.YearNo, period.MonthNo, period.Id, DateTime.UtcNow, command.UnlockReason), cancellationToken);
        return ApiResponse<PayrollPeriodDto>.Ok(period.ToDto(), "Payroll unlocked.");
    }

    public Task<ApiResponse<PayrollLockCheckDto>> Handle(CheckPayrollLockQuery query, CancellationToken cancellationToken)
    {
        var period = db.PayrollPeriods.FirstOrDefault(x => x.CompanyId == query.CompanyId && x.YearNo == query.YearNo && x.MonthNo == query.MonthNo);
        return Task.FromResult(ApiResponse<PayrollLockCheckDto>.Ok(new PayrollLockCheckDto(period?.Id, period?.IsPayrollLocked ?? false, period?.Status)));
    }

    private void ApplyAdvanceBalances(PayrollPeriod period)
    {
        var approvedPayrolls = db.EmployeePayrolls.Where(x => x.PayrollPeriodId == period.Id).ToList();
        foreach (var payroll in approvedPayrolls.Where(x => x.AdvanceDeduction > 0))
        {
            var installments = db.SalaryAdvanceInstallments
                .Where(x => x.CompanyId == period.CompanyId && x.EmployeeId == payroll.EmployeeId && x.YearNo == period.YearNo && x.MonthNo == period.MonthNo && x.Status == "Deducted")
                .ToList();
            foreach (var installment in installments)
            {
                var advance = db.SalaryAdvances.FirstOrDefault(x => x.Id == installment.SalaryAdvanceId);
                if (advance is null || advance.Status == "Closed")
                {
                    continue;
                }

                advance.PaidAmount = db.SalaryAdvanceInstallments
                    .Where(x => x.SalaryAdvanceId == advance.Id && x.Status == "Deducted")
                    .Sum(x => x.PaidAmount);
                advance.BalanceAmount = Math.Max(0, advance.AdvanceAmount - advance.PaidAmount);
                advance.Status = advance.BalanceAmount == 0 ? "Closed" : "Running";
            }
        }
    }
}

public sealed class ProcessPayrollHandler(
    IPayrollDbContext db,
    IPayrollCalculationService payrollCalculationService,
    ISalaryAdvanceService salaryAdvanceService,
    IEmployeeServiceClient employeeServiceClient,
    IAttendanceServiceClient attendanceServiceClient,
    ILeaveServiceClient leaveServiceClient,
    IIntegrationEventPublisher publisher) :
    IRequestHandler<ProcessPayrollCommand, ApiResponse<PayrollSummaryDto>>,
    IRequestHandler<ReprocessPayrollCommand, ApiResponse<PayrollSummaryDto>>
{
    public Task<ApiResponse<PayrollSummaryDto>> Handle(ProcessPayrollCommand command, CancellationToken cancellationToken) =>
        ProcessAsync(command.Request with { ForceReprocess = false }, cancellationToken);

    public Task<ApiResponse<PayrollSummaryDto>> Handle(ReprocessPayrollCommand command, CancellationToken cancellationToken) =>
        ProcessAsync(command.Request with { ForceReprocess = true }, cancellationToken);

    private async Task<ApiResponse<PayrollSummaryDto>> ProcessAsync(ProcessPayrollRequest request, CancellationToken cancellationToken)
    {
        var period = db.PayrollPeriods.FirstOrDefault(x => x.CompanyId == request.CompanyId && x.YearNo == request.YearNo && x.MonthNo == request.MonthNo);
        if (period is null) return ApiResponse<PayrollSummaryDto>.Fail("Payroll period does not exist.");
        if (period.IsPayrollLocked) return ApiResponse<PayrollSummaryDto>.Fail("Payroll period is locked.");

        var policy = db.PayrollPolicies.Where(x => x.CompanyId == request.CompanyId && x.IsActive).OrderByDescending(x => x.CreatedAt).FirstOrDefault();
        if (policy is null) return ApiResponse<PayrollSummaryDto>.Fail("Active payroll policy not found.");

        if (!await attendanceServiceClient.IsMonthlyAttendanceApprovedAsync(request.CompanyId, request.YearNo, request.MonthNo, cancellationToken))
        {
            return ApiResponse<PayrollSummaryDto>.Fail("Monthly attendance summary is not approved.");
        }

        if (!request.ForceReprocess && db.EmployeePayrolls.Any(x => x.PayrollPeriodId == period.Id))
        {
            return ApiResponse<PayrollSummaryDto>.Fail("Payroll already processed. Use reprocess endpoint.");
        }

        if (request.ForceReprocess)
        {
            foreach (var oldPayroll in db.EmployeePayrolls.Where(x => x.PayrollPeriodId == period.Id).ToList())
            {
                foreach (var installment in db.SalaryAdvanceInstallments.Where(x => x.EmployeePayrollId == oldPayroll.Id).ToList())
                {
                    installment.Status = "Pending";
                    installment.PaidAmount = 0;
                    installment.EmployeePayrollId = null;
                }

                foreach (var earning in db.PayrollEarnings.Where(x => x.EmployeePayrollId == oldPayroll.Id).ToList()) db.Remove(earning);
                foreach (var deduction in db.PayrollDeductions.Where(x => x.EmployeePayrollId == oldPayroll.Id).ToList()) db.Remove(deduction);
                db.Remove(oldPayroll);
            }
        }

        var runNo = db.PayrollRuns.Count(x => x.PayrollPeriodId == period.Id) + 1;
        var run = new PayrollRun { CompanyId = request.CompanyId, PayrollPeriodId = period.Id, RunNo = runNo, RunStatus = "Processing", ProcessedBy = request.ProcessedBy };
        db.Add(run);

        var employees = (await employeeServiceClient.GetActiveEmployeesAsync(request.CompanyId, cancellationToken)).ToList();
        if (employees.Count == 0)
        {
            employees = db.EmployeeSalaries
                .Where(x => x.CompanyId == request.CompanyId && x.EffectiveFrom <= period.EndDate && (!x.EffectiveTo.HasValue || x.EffectiveTo >= period.StartDate))
                .GroupBy(x => x.EmployeeId)
                .Select(x => x.OrderByDescending(s => s.EffectiveFrom).First())
                .Select(x => new EmployeeSnapshot(x.EmployeeId, x.CompanyId, x.EffectiveFrom, true))
                .ToList();
        }

        run.TotalEmployees = employees.Count;
        foreach (var employee in employees)
        {
            var salary = db.EmployeeSalaries
                .Where(x => x.CompanyId == request.CompanyId && x.EmployeeId == employee.EmployeeId && x.EffectiveFrom <= period.EndDate && (!x.EffectiveTo.HasValue || x.EffectiveTo >= period.StartDate))
                .OrderByDescending(x => x.EffectiveFrom)
                .FirstOrDefault();
            if (salary is null)
            {
                run.FailedEmployees++;
                continue;
            }

            var attendance = await attendanceServiceClient.GetApprovedMonthlySummaryAsync(request.CompanyId, employee.EmployeeId, request.YearNo, request.MonthNo, cancellationToken);
            if (attendance is null || !attendance.IsApproved)
            {
                run.FailedEmployees++;
                continue;
            }

            var advanceDeduction = await salaryAdvanceService.GetDeductibleInstallmentAsync(request.CompanyId, employee.EmployeeId, request.YearNo, request.MonthNo, cancellationToken);
            var otherDeductions = db.PayrollDeductionEntries
                .Where(x => x.CompanyId == request.CompanyId && x.EmployeeId == employee.EmployeeId && x.YearNo == request.YearNo && x.MonthNo == request.MonthNo && x.Status == "Approved")
                .ToList();
            var leaveEncashment = await leaveServiceClient.GetApprovedLeaveEncashmentAsync(request.CompanyId, employee.EmployeeId, request.YearNo, request.MonthNo, cancellationToken);
            var manualTiffin = db.AllowanceBills.Where(x => x.CompanyId == request.CompanyId && x.EmployeeId == employee.EmployeeId && x.Status == "Approved" && x.AllowanceType == "TiffinBill" && x.BillDate >= period.StartDate && x.BillDate <= period.EndDate).Sum(x => x.Amount);
            var manualNight = db.AllowanceBills.Where(x => x.CompanyId == request.CompanyId && x.EmployeeId == employee.EmployeeId && x.Status == "Approved" && x.AllowanceType == "NightBill" && x.BillDate >= period.StartDate && x.BillDate <= period.EndDate).Sum(x => x.Amount);

            var calc = payrollCalculationService.Calculate(policy, salary, attendance, new PayrollCalculationInputs(
                EarnLeaveEncashmentAmount: leaveEncashment,
                AdvanceDeduction: advanceDeduction,
                LoanDeduction: otherDeductions.Where(x => x.DeductionType == "Loan").Sum(x => x.Amount),
                TaxDeduction: otherDeductions.Where(x => x.DeductionType == "Tax").Sum(x => x.Amount),
                ProvidentFundDeduction: otherDeductions.Where(x => x.DeductionType == "ProvidentFund").Sum(x => x.Amount),
                OtherDeduction: otherDeductions.Where(x => x.DeductionType is not ("Loan" or "Tax" or "ProvidentFund")).Sum(x => x.Amount)));

            var payroll = new EmployeePayroll
            {
                CompanyId = request.CompanyId,
                PayrollPeriodId = period.Id,
                PayrollRunId = run.Id,
                EmployeeId = employee.EmployeeId,
                SalaryCalculationType = policy.SalaryCalculationType,
                GrossSalary = salary.GrossSalary,
                BasicSalary = salary.BasicSalary,
                TotalDays = calc.TotalDays,
                WorkingDays = attendance.WorkingDays,
                PresentDays = attendance.PresentDays,
                AbsentDays = attendance.AbsentDays,
                LeaveDays = attendance.LeaveDays,
                LeaveWithoutPayDays = attendance.LeaveWithoutPayDays,
                LateDays = attendance.LateDays,
                HolidayPresentDays = attendance.HolidayPresentDays,
                WeeklyOffPresentDays = attendance.WeeklyOffPresentDays,
                TotalOvertimeMinutes = attendance.OvertimeMinutes,
                OvertimeHours = calc.OvertimeHours,
                OvertimeRate = calc.OvertimeRate,
                OvertimeAmount = calc.OvertimeAmount,
                TiffinBillAmount = calc.TiffinBillAmount + manualTiffin,
                NightBillAmount = calc.NightBillAmount + manualNight,
                AttendanceBonusAmount = calc.AttendanceBonusAmount,
                EarnLeaveEncashmentAmount = calc.EarnLeaveEncashmentAmount,
                TotalEarnings = calc.TotalEarnings + manualTiffin + manualNight,
                AbsentDeduction = calc.AbsentDeduction,
                LateDeduction = calc.LateDeduction,
                AdvanceDeduction = advanceDeduction,
                LoanDeduction = otherDeductions.Where(x => x.DeductionType == "Loan").Sum(x => x.Amount),
                TaxDeduction = otherDeductions.Where(x => x.DeductionType == "Tax").Sum(x => x.Amount),
                ProvidentFundDeduction = otherDeductions.Where(x => x.DeductionType == "ProvidentFund").Sum(x => x.Amount),
                OtherDeduction = otherDeductions.Where(x => x.DeductionType is not ("Loan" or "Tax" or "ProvidentFund")).Sum(x => x.Amount),
                TotalDeduction = calc.TotalDeduction,
                NetSalary = calc.NetSalary + manualTiffin + manualNight,
                Status = "Processed",
            };

            db.Add(payroll);
            AddEarnings(payroll, salary, calc, manualTiffin, manualNight);
            AddDeductions(payroll);
            await salaryAdvanceService.MarkInstallmentDeductedAsync(request.CompanyId, employee.EmployeeId, request.YearNo, request.MonthNo, payroll.Id, cancellationToken);
            run.ProcessedEmployees++;
        }

        run.RunStatus = run.FailedEmployees == 0 ? "Success" : run.ProcessedEmployees == 0 ? "Failed" : "Partial";
        period.Status = "Processed";
        await db.SaveChangesAsync(cancellationToken);
        var summary = BuildSummary(period.Id);
        await publisher.PublishAsync(new PayrollProcessedEvent(request.CompanyId, request.YearNo, request.MonthNo, period.Id, run.Id, run.ProcessedEmployees, DateTime.UtcNow), cancellationToken);
        return ApiResponse<PayrollSummaryDto>.Ok(summary, "Payroll processed.");
    }

    private void AddEarnings(EmployeePayroll p, EmployeeSalary s, PayrollCalculationResult c, decimal manualTiffin, decimal manualNight)
    {
        foreach (var earning in new[]
        {
            new PayrollEarning { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "Basic", EarningName = "Basic", Amount = s.BasicSalary },
            new PayrollEarning { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "HouseRent", EarningName = "House Rent", Amount = s.HouseRent },
            new PayrollEarning { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "Medical", EarningName = "Medical", Amount = s.MedicalAllowance },
            new PayrollEarning { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "Conveyance", EarningName = "Conveyance", Amount = s.ConveyanceAllowance },
            new PayrollEarning { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "Food", EarningName = "Food", Amount = s.FoodAllowance },
            new PayrollEarning { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "Overtime", EarningName = "Overtime", Amount = c.OvertimeAmount },
            new PayrollEarning { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "TiffinBill", EarningName = "Tiffin Bill", Amount = c.TiffinBillAmount + manualTiffin },
            new PayrollEarning { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "NightBill", EarningName = "Night Bill", Amount = c.NightBillAmount + manualNight },
            new PayrollEarning { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "AttendanceBonus", EarningName = "Attendance Bonus", Amount = c.AttendanceBonusAmount },
            new PayrollEarning { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "EarnLeaveEncashment", EarningName = "Earn Leave Encashment", Amount = c.EarnLeaveEncashmentAmount },
        }.Where(x => x.Amount > 0))
        {
            db.Add(earning);
        }
    }

    private void AddDeductions(EmployeePayroll p)
    {
        foreach (var deduction in new[]
        {
            new PayrollDeduction { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, DeductionCode = "Absent", DeductionName = "Absent", Amount = p.AbsentDeduction },
            new PayrollDeduction { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, DeductionCode = "Late", DeductionName = "Late", Amount = p.LateDeduction },
            new PayrollDeduction { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, DeductionCode = "Advance", DeductionName = "Advance", Amount = p.AdvanceDeduction },
            new PayrollDeduction { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, DeductionCode = "Loan", DeductionName = "Loan", Amount = p.LoanDeduction },
            new PayrollDeduction { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, DeductionCode = "Tax", DeductionName = "Tax", Amount = p.TaxDeduction },
            new PayrollDeduction { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, DeductionCode = "ProvidentFund", DeductionName = "Provident Fund", Amount = p.ProvidentFundDeduction },
            new PayrollDeduction { CompanyId = p.CompanyId, EmployeePayrollId = p.Id, DeductionCode = "Other", DeductionName = "Other", Amount = p.OtherDeduction },
        }.Where(x => x.Amount > 0))
        {
            db.Add(deduction);
        }
    }

    private PayrollSummaryDto BuildSummary(Guid periodId)
    {
        var rows = db.EmployeePayrolls.Where(x => x.PayrollPeriodId == periodId).ToList();
        var period = db.PayrollPeriods.First(x => x.Id == periodId);
        return new PayrollSummaryDto(periodId, rows.Count, rows.Sum(x => x.GrossSalary), rows.Sum(x => x.TotalEarnings), rows.Sum(x => x.TotalDeduction), rows.Sum(x => x.NetSalary), period.Status);
    }
}
