using Microsoft.EntityFrameworkCore;
using ShiftService.Application.Common;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Application.DTOs;
using ShiftService.Domain.Entities;
using ShiftService.Domain.Enums;
using ShiftService.Infrastructure.Persistence;

namespace ShiftService.Infrastructure.Services;

public sealed class ShiftEvaluationService(
    ShiftDbContext db,
    IShiftSelectionService selection,
    ILeaveCalendarProvider leaveCalendar) : IShiftEvaluationService
{
    public async Task<ShiftEvaluationDto> EvaluateAsync(
        Guid companyId,
        Guid employeeId,
        DateTime attendanceDate,
        CancellationToken cancellationToken = default)
    {
        var date = attendanceDate.Date;
        var selected = await selection.GetApplicableShiftWithSourceAsync(companyId, employeeId, date);
        var shift = selected?.Shift
            ?? await db.Shifts.AsNoTracking()
                .FirstOrDefaultAsync(s => s.CompanyId == companyId && s.IsDefault && s.IsActive, cancellationToken)
            ?? await db.Shifts.AsNoTracking()
                .Where(s => s.CompanyId == companyId)
                .OrderByDescending(s => s.IsActive)
                .ThenByDescending(s => s.IsDefault)
                .FirstOrDefaultAsync(cancellationToken)
            ?? CreateFallbackShift(companyId);
        var assignmentSource = selected?.AssignmentSource ?? (shift.Id == Guid.Empty ? "Fallback" : "General");

        var rule = await db.ShiftRules.AsNoTracking()
            .FirstOrDefaultAsync(r => r.ShiftId == shift.Id, cancellationToken)
            ?? ShiftPolicyTemplates.CreateDefaultRule(companyId, shift.Id, shift.ShiftCategory);

        var (shiftStart, shiftEnd) = ShiftWindowCalculator.GetShiftBounds(date, shift);
        var (windowStart, windowEnd) = ShiftWindowCalculator.GetPunchWindow(
            date,
            shift,
            rule.OutGraceMinutes,
            rule.MaximumOvertimeMinutes);

        var isShiftWeeklyOff = shift.WeeklyOffDayOfWeek.HasValue
            && shift.WeeklyOffDayOfWeek.Value == (int)date.DayOfWeek;
        var isLeaveWeeklyOff = await leaveCalendar.IsWeeklyOffAsync(companyId, date, cancellationToken);
        var isWeeklyOff = isShiftWeeklyOff || isLeaveWeeklyOff;
        var isHoliday = await leaveCalendar.IsHolidayAsync(companyId, date, cancellationToken);

        var calendarDayType = isHoliday ? "Holiday"
            : isWeeklyOff ? "WeeklyOff"
            : "WorkingDay";

        var fullOt = (isHoliday && rule.HolidayWorkAllAsOvertime)
            || (isWeeklyOff && rule.WeeklyOffWorkAllAsOvertime);

        return new ShiftEvaluationDto(
            companyId,
            employeeId,
            date,
            shift.Id,
            shift.ShiftName,
            shift.ShiftCategory.ToString(),
            shiftStart,
            shiftEnd,
            shift.IsCrossDay,
            windowStart,
            windowEnd,
            calendarDayType,
            isWeeklyOff,
            isHoliday,
            fullOt,
            ShiftDtoMapping.ToPolicyDto(rule),
            assignmentSource);
    }

    private static Shift CreateFallbackShift(Guid companyId) =>
        new()
        {
            Id = Guid.Empty,
            CompanyId = companyId,
            ShiftName = "General",
            ShiftType = "GeneralDuty",
            ShiftCategory = ShiftCategory.GeneralDuty,
            PunchWindowBeforeMinutes = 60,
            StartTime = new TimeSpan(9, 0, 0),
            EndTime = new TimeSpan(18, 0, 0),
            IsCrossDay = false,
            IsGeneralDuty = true,
            IsDefault = true,
            IsActive = true
        };
}
