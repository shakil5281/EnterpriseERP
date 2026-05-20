using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Infrastructure.Persistence.PunchData;
using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Infrastructure.Services;

public sealed class PunchRecordReader(PunchDataReadDbContext db) : IPunchRecordReader
{
    public Task<IReadOnlyList<PunchRecordRow>> GetForCompanyAndDateAsync(
        int punchCompanyId,
        DateTime date,
        CancellationToken cancellationToken = default) =>
        GetForCompanyAndRangeAsync(punchCompanyId, date.Date, date.Date.AddDays(1), cancellationToken);

    public async Task<IReadOnlyList<PunchRecordRow>> GetForCompanyAndRangeAsync(
        int punchCompanyId,
        DateTime fromInclusive,
        DateTime toExclusive,
        CancellationToken cancellationToken = default)
    {
        var dayStart = ToDhakaOffset(fromInclusive);
        var dayEnd = ToDhakaOffset(toExclusive);

        // Raw SQL + keyless long types — avoids EF casting bigint columns to int.
        var rows = await db.PunchRecordRows
            .FromSqlInterpolated($"""
                SELECT Id, CompanyId, PunchNumber, DeviceId, PunchTime
                FROM PunchRecords
                WHERE CompanyId = {punchCompanyId}
                  AND PunchTime >= {dayStart}
                  AND PunchTime < {dayEnd}
                ORDER BY PunchTime
                """)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return rows
            .Select(p => new PunchRecordRow(
                Guid.TryParse(p.Id, out var punchId) ? punchId : Guid.Empty,
                ToCompanyIdInt(p.CompanyId),
                ToPunchNumberInt(p.PunchNumber),
                p.DeviceId ?? string.Empty,
                DateTime.SpecifyKind(p.PunchTime.DateTime, DateTimeKind.Unspecified)))
            .ToList();
    }

    private static int ToPunchNumberInt(long punchNumber) =>
        punchNumber is > 0 and <= int.MaxValue ? (int)punchNumber : 0;

    private static int ToCompanyIdInt(long companyId) =>
        companyId is > 0 and <= int.MaxValue ? (int)companyId : 0;

    private static DateTimeOffset ToDhakaOffset(DateTime value)
    {
        var local = DateTime.SpecifyKind(value, DateTimeKind.Unspecified);
        return new DateTimeOffset(local, TimeSpan.FromHours(6));
    }
}
