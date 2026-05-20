using MediatR;
using AttendanceService.Application.Common;
using AttendanceService.Application.DTOs;

namespace AttendanceService.Application.Features.Attendance.Commands;

public record ProcessDailyAttendanceRangeCommand(
    Guid CompanyId,
    DateTime StartDate,
    DateTime EndDate,
    IReadOnlyList<string>? EmployeeIDs = null) : IRequest<ProcessRangeResult>;

public sealed class ProcessDailyAttendanceRangeHandler(IMediator mediator)
    : IRequestHandler<ProcessDailyAttendanceRangeCommand, ProcessRangeResult>
{
    public async Task<ProcessRangeResult> Handle(
        ProcessDailyAttendanceRangeCommand request,
        CancellationToken cancellationToken)
    {
        var start = AttendanceDateRange.ToCalendarDate(request.StartDate);
        var end = AttendanceDateRange.ToCalendarDate(request.EndDate);
        if (end < start)
        {
            (start, end) = (end, start);
        }

        var errors = new List<ProcessRangeDayError>();
        var daysProcessed = 0;
        var recordsProcessed = 0;
        var presentCount = 0;
        var absentCount = 0;
        var lateCount = 0;

        for (var day = start; day <= end; day = day.AddDays(1))
        {
            try
            {
                var result = await mediator.Send(new ProcessDailyAttendanceCommand(request.CompanyId, day), cancellationToken);
                daysProcessed++;
                recordsProcessed += result.RecordsProcessed;
                presentCount += result.PresentCount;
                absentCount += result.AbsentCount;
                lateCount += result.LateCount;
            }
            catch (Exception ex)
            {
                errors.Add(new ProcessRangeDayError(day.ToString("yyyy-MM-dd"), ex.Message));
            }
        }

        return new ProcessRangeResult(daysProcessed, recordsProcessed, presentCount, absentCount, lateCount, errors);
    }
}
