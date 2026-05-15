using MediatR;
using ShiftService.Application.DTOs;
using ShiftService.Domain.Entities;
using ShiftService.Application.Common.Interfaces;

namespace ShiftService.Application.Features.Shifts.Commands;

public record CreateShiftCommand(
    Guid CompanyId, string ShiftCode, string ShiftName, string ShiftType,
    TimeSpan StartTime, TimeSpan EndTime, bool IsCrossDay, bool IsGeneralDuty,
    bool IsDefault) : IRequest<Guid>;

public class CreateShiftCommandHandler(IShiftDbContext db) : IRequestHandler<CreateShiftCommand, Guid>
{
    public async Task<Guid> Handle(CreateShiftCommand request, CancellationToken cancellationToken)
    {
        var shift = new Shift
        {
            Id = Guid.NewGuid(),
            CompanyId = request.CompanyId,
            ShiftCode = request.ShiftCode,
            ShiftName = request.ShiftName,
            ShiftType = request.ShiftType,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            IsCrossDay = request.IsCrossDay,
            IsGeneralDuty = request.IsGeneralDuty,
            IsDefault = request.IsDefault,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Shifts.Add(shift);
        await db.SaveChangesAsync(cancellationToken);
        return shift.Id;
    }
}
