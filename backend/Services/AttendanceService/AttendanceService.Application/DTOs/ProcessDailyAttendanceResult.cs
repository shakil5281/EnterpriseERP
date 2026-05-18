namespace AttendanceService.Application.DTOs;

public sealed record ProcessDailyAttendanceResult(
    int RecordsProcessed,
    int PresentCount,
    int AbsentCount,
    int LateCount);
