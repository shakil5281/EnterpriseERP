using MediatR;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ShiftService.Application.Features.Shifts.Commands;

public record AssignEmployeeShiftCommand(
    Guid CompanyId, Guid EmployeeId, Guid ShiftId, DateTime EffectiveFrom,
    DateTime? EffectiveTo, Guid? AssignedBy) : IRequest<Guid>;

public record AssignTemporaryShiftCommand(
    Guid CompanyId, Guid EmployeeId, Guid ShiftId, DateTime ShiftDate,
    string? Reason, Guid? CreatedBy) : IRequest<Guid>;

public class AssignmentHandlers(IShiftDbContext db) :
    IRequestHandler<AssignEmployeeShiftCommand, Guid>,
    IRequestHandler<AssignTemporaryShiftCommand, Guid>,
    IRequestHandler<DeleteTemporaryShiftCommand, bool>
{
    public async Task<Guid> Handle(AssignEmployeeShiftCommand request, CancellationToken cancellationToken)
    {
        // One employee can have only one current shift per company.
        var current = await db.EmployeeShiftAssignments
            .FirstOrDefaultAsync(a => a.CompanyId == request.CompanyId
                && a.EmployeeId == request.EmployeeId
                && a.IsCurrent, cancellationToken);

        if (current != null)
        {
            current.IsCurrent = false;
            current.EffectiveTo ??= request.EffectiveFrom.AddDays(-1);
        }

        var assignment = new EmployeeShiftAssignment
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            EmployeeId = request.EmployeeId,
            ShiftId = request.ShiftId,
            EffectiveFrom = request.EffectiveFrom,
            EffectiveTo = request.EffectiveTo,
            IsCurrent = true,
            AssignedBy = request.AssignedBy,
            AssignedAt = DateTime.UtcNow
        };

        db.EmployeeShiftAssignments.Add(assignment);
        await db.SaveChangesAsync(cancellationToken);
        return assignment.Id;
    }

    public async Task<Guid> Handle(AssignTemporaryShiftCommand request, CancellationToken cancellationToken)
    {
        // Temporary shift overrides regular shift. Unique per company, employee, and date.
        var assignment = await db.TemporaryShiftAssignments
            .FirstOrDefaultAsync(a => a.CompanyId == request.CompanyId
                && a.EmployeeId == request.EmployeeId
                && a.ShiftDate.Date == request.ShiftDate.Date, cancellationToken);

        if (assignment is null)
        {
            assignment = new TemporaryShiftAssignment
            {
                Id = Guid.NewGuid(),
                CompanyId = request.CompanyId,
                EmployeeId = request.EmployeeId,
                ShiftDate = request.ShiftDate.Date,
                CreatedAt = DateTime.UtcNow
            };
            db.TemporaryShiftAssignments.Add(assignment);
        }

        assignment.ShiftId = request.ShiftId;
        assignment.Reason = request.Reason;
        assignment.CreatedBy = request.CreatedBy;

        await db.SaveChangesAsync(cancellationToken);
        return assignment.Id;
    }

    public async Task<bool> Handle(DeleteTemporaryShiftCommand request, CancellationToken cancellationToken)
    {
        var temp = await db.TemporaryShiftAssignments.FindAsync([request.Id], cancellationToken);
        if (temp == null) return false;

        db.TemporaryShiftAssignments.Remove(temp);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}

public record DeleteTemporaryShiftCommand(Guid Id) : IRequest<bool>;
