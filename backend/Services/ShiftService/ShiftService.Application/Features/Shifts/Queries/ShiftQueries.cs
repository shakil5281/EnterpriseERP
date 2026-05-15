using MediatR;
using Microsoft.EntityFrameworkCore;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Application.DTOs;

namespace ShiftService.Application.Features.Shifts.Queries;

public record GetShiftByIdQuery(Guid Id) : IRequest<ShiftDto?>;
public record GetCurrentEmployeeShiftQuery(Guid EmployeeId, Guid CompanyId) : IRequest<EmployeeShiftAssignmentDto?>;
public record GetEmployeeShiftHistoryQuery(Guid EmployeeId, Guid CompanyId) : IRequest<IEnumerable<EmployeeShiftAssignmentDto>>;
public record GetTemporaryShiftByDateQuery(Guid EmployeeId, Guid CompanyId, DateTime Date) : IRequest<TemporaryShiftAssignmentDto?>;
public record GetShiftCalendarQuery(Guid CompanyId, DateTime FromDate, DateTime ToDate) : IRequest<IEnumerable<ShiftCalendarDto>>;

public class ShiftQueryHandlers(IShiftDbContext db) :
    IRequestHandler<GetShiftByIdQuery, ShiftDto?>,
    IRequestHandler<GetCurrentEmployeeShiftQuery, EmployeeShiftAssignmentDto?>,
    IRequestHandler<GetEmployeeShiftHistoryQuery, IEnumerable<EmployeeShiftAssignmentDto>>,
    IRequestHandler<GetTemporaryShiftByDateQuery, TemporaryShiftAssignmentDto?>,
    IRequestHandler<GetShiftCalendarQuery, IEnumerable<ShiftCalendarDto>>
{
    public async Task<ShiftDto?> Handle(GetShiftByIdQuery request, CancellationToken cancellationToken)
    {
        return await db.Shifts
            .AsNoTracking()
            .Where(s => s.Id == request.Id)
            .Select(s => new ShiftDto(s.Id, s.CompanyId, s.ShiftCode, s.ShiftName, s.ShiftType, s.StartTime, s.EndTime, s.IsCrossDay, s.IsGeneralDuty, s.IsDefault, s.IsActive))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<EmployeeShiftAssignmentDto?> Handle(GetCurrentEmployeeShiftQuery request, CancellationToken cancellationToken)
    {
        return await db.EmployeeShiftAssignments
            .AsNoTracking()
            .Include(a => a.Shift)
            .Where(a => a.EmployeeId == request.EmployeeId && a.CompanyId == request.CompanyId && a.IsCurrent)
            .Select(a => new EmployeeShiftAssignmentDto(a.Id, a.EmployeeId, a.ShiftId, a.Shift!.ShiftName, a.EffectiveFrom, a.EffectiveTo, a.IsCurrent))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IEnumerable<EmployeeShiftAssignmentDto>> Handle(GetEmployeeShiftHistoryQuery request, CancellationToken cancellationToken)
    {
        return await db.EmployeeShiftAssignments
            .AsNoTracking()
            .Include(a => a.Shift)
            .Where(a => a.EmployeeId == request.EmployeeId && a.CompanyId == request.CompanyId)
            .OrderByDescending(a => a.EffectiveFrom)
            .Select(a => new EmployeeShiftAssignmentDto(a.Id, a.EmployeeId, a.ShiftId, a.Shift!.ShiftName, a.EffectiveFrom, a.EffectiveTo, a.IsCurrent))
            .ToListAsync(cancellationToken);
    }

    public async Task<TemporaryShiftAssignmentDto?> Handle(GetTemporaryShiftByDateQuery request, CancellationToken cancellationToken)
    {
        return await db.TemporaryShiftAssignments
            .AsNoTracking()
            .Include(a => a.Shift)
            .Where(a => a.EmployeeId == request.EmployeeId && a.CompanyId == request.CompanyId && a.ShiftDate.Date == request.Date.Date)
            .Select(a => new TemporaryShiftAssignmentDto(a.Id, a.EmployeeId, a.ShiftId, a.Shift!.ShiftName, a.ShiftDate, a.Reason))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IEnumerable<ShiftCalendarDto>> Handle(GetShiftCalendarQuery request, CancellationToken cancellationToken)
    {
        return await db.ShiftCalendars
            .AsNoTracking()
            .Where(c => c.CompanyId == request.CompanyId && c.CalendarDate >= request.FromDate && c.CalendarDate <= request.ToDate)
            .Select(c => new ShiftCalendarDto(c.Id, c.EmployeeId, c.ShiftId, c.CalendarDate, c.DayType, c.Remarks))
            .ToListAsync(cancellationToken);
    }
}
