using ShiftService.Domain.Enums;

namespace ShiftService.Application.DTOs;

public record ShiftDto(
    Guid Id, Guid CompanyId, string ShiftCode, string ShiftName, string ShiftType,
    TimeSpan StartTime, TimeSpan EndTime, bool IsCrossDay, bool IsGeneralDuty,
    bool IsDefault, bool IsActive);

public record ShiftRuleDto(
    Guid Id, Guid ShiftId, int InGraceMinutes, int OutGraceMinutes,
    int LateAfterMinutes, int EarlyOutBeforeMinutes, int MinimumWorkingMinutes,
    int HalfDayWorkingMinutes, bool AllowOvertime, int OvertimeStartAfterMinutes,
    int MinimumOvertimeMinutes, int MaximumOvertimeMinutes);

public record ShiftBreakDto(
    Guid Id, Guid ShiftId, string BreakName, TimeSpan BreakStartTime,
    TimeSpan BreakEndTime, int BreakMinutes, bool IsPaidBreak, bool IsActive);

public record EmployeeShiftAssignmentDto(
    Guid Id, Guid EmployeeId, Guid ShiftId, string ShiftName,
    DateTime EffectiveFrom, DateTime? EffectiveTo, bool IsCurrent);

public record TemporaryShiftAssignmentDto(
    Guid Id, Guid EmployeeId, Guid ShiftId, string ShiftName,
    DateTime ShiftDate, string? Reason);

public record ShiftCalendarDto(
    Guid Id, Guid? EmployeeId, Guid? ShiftId, DateTime CalendarDate,
    string DayType, string? Remarks);
