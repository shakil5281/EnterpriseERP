using MediatR;
using ShiftService.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ShiftService.Application.Features.Shifts.Commands;

public record UpdateShiftCommand(
    Guid Id, string ShiftName, string ShiftType, TimeSpan StartTime, TimeSpan EndTime,
    bool IsCrossDay, bool IsGeneralDuty, bool IsDefault) : IRequest<bool>;

public record ActivateShiftCommand(Guid Id) : IRequest<bool>;
public record DeactivateShiftCommand(Guid Id) : IRequest<bool>;

public class ShiftCommandHandlers(IShiftDbContext db) : 
    IRequestHandler<UpdateShiftCommand, bool>,
    IRequestHandler<ActivateShiftCommand, bool>,
    IRequestHandler<DeactivateShiftCommand, bool>
{
    public async Task<bool> Handle(UpdateShiftCommand request, CancellationToken cancellationToken)
    {
        var shift = await db.Shifts.FindAsync([request.Id], cancellationToken);
        if (shift == null) return false;

        shift.ShiftName = request.ShiftName;
        shift.ShiftType = request.ShiftType;
        shift.StartTime = request.StartTime;
        shift.EndTime = request.EndTime;
        shift.IsCrossDay = request.IsCrossDay;
        shift.IsGeneralDuty = request.IsGeneralDuty;
        shift.IsDefault = request.IsDefault;
        shift.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> Handle(ActivateShiftCommand request, CancellationToken cancellationToken)
    {
        var shift = await db.Shifts.FindAsync([request.Id], cancellationToken);
        if (shift == null) return false;

        shift.IsActive = true;
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> Handle(DeactivateShiftCommand request, CancellationToken cancellationToken)
    {
        var shift = await db.Shifts.FindAsync([request.Id], cancellationToken);
        if (shift == null) return false;

        shift.IsActive = false;
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
