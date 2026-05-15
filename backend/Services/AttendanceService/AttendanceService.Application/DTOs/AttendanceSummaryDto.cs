namespace AttendanceService.Application.DTOs;

public record AttendanceSummaryDto(
    Guid EmployeeId,
    int TotalPresent,
    int TotalAbsent,
    int TotalLate,
    int TotalEarlyOut,
    int TotalOTMinutes,
    int TotalWorkingMinutes,
    int TotalHolidays,
    int TotalWeeklyOffs);
