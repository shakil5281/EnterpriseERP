using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using AttendanceService.Domain.Enums;

namespace AttendanceService.Application.Features.Attendance.Queries;

public record GetDailyAttendanceQuery(Guid CompanyId, DateTime FromDate, DateTime ToDate, Guid? EmployeeId = null) : IRequest<IEnumerable<DailyAttendanceDto>>;

public class AttendanceQueryHandlers(IAttendanceDbContext db) :
    IRequestHandler<GetDailyAttendanceQuery, IEnumerable<DailyAttendanceDto>>
{
    public async Task<IEnumerable<DailyAttendanceDto>> Handle(GetDailyAttendanceQuery request, CancellationToken cancellationToken)
    {
        var query = db.DailyAttendances.AsNoTracking()
            .Where(a => a.CompanyId == request.CompanyId && a.AttendanceDate >= request.FromDate && a.AttendanceDate <= request.ToDate);

        if (request.EmployeeId.HasValue)
        {
            query = query.Where(a => a.EmployeeId == request.EmployeeId);
        }

        return await query.Select(a => new DailyAttendanceDto(
            a.Id, a.EmployeeId, a.AttendanceDate, a.InTime, a.OutTime, a.ShiftCode,
            a.LateMinutes, a.OTMinutes, a.WorkingMinutes, a.Status.ToString(), a.Remarks))
            .ToListAsync(cancellationToken);
    }
}

public record GetAttendanceSummaryQuery(Guid CompanyId, DateTime FromDate, DateTime ToDate, Guid? EmployeeId = null) : IRequest<IEnumerable<AttendanceSummaryDto>>;

public class AttendanceSummaryQueryHandler(IAttendanceDbContext db) :
    IRequestHandler<GetAttendanceSummaryQuery, IEnumerable<AttendanceSummaryDto>>
{
    public async Task<IEnumerable<AttendanceSummaryDto>> Handle(GetAttendanceSummaryQuery request, CancellationToken cancellationToken)
    {
        var data = await db.DailyAttendances.AsNoTracking()
            .Where(a => a.CompanyId == request.CompanyId && a.AttendanceDate >= request.FromDate && a.AttendanceDate <= request.ToDate)
            .GroupBy(a => a.EmployeeId)
            .Select(g => new AttendanceSummaryDto(
                g.Key,
                g.Count(x => x.Status == AttendanceStatus.Present || x.Status == AttendanceStatus.Late || x.Status == AttendanceStatus.EarlyOut),
                g.Count(x => x.Status == AttendanceStatus.Absent),
                g.Count(x => x.Status == AttendanceStatus.Late),
                g.Count(x => x.Status == AttendanceStatus.EarlyOut),
                g.Sum(x => x.OTMinutes),
                g.Sum(x => x.WorkingMinutes),
                g.Count(x => x.IsHoliday),
                g.Count(x => x.IsWeeklyOff)
            ))
            .ToListAsync(cancellationToken);

        return data;
    }
}
