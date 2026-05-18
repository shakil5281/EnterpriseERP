using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Infrastructure.Persistence.PunchData;
using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Infrastructure.Services;

public sealed class PunchRecordReader(PunchDataReadDbContext db) : IPunchRecordReader
{
    public async Task<IReadOnlyList<PunchRecordRow>> GetForCompanyAndDateAsync(
        int punchCompanyId,
        DateTime date,
        CancellationToken cancellationToken = default)
    {
        return await GetForCompanyAndRangeAsync(
            punchCompanyId,
            date.Date,
            date.Date.AddDays(1),
            cancellationToken);
    }

    public async Task<IReadOnlyList<PunchRecordRow>> GetForCompanyAndRangeAsync(
        int punchCompanyId,
        DateTime fromInclusive,
        DateTime toExclusive,
        CancellationToken cancellationToken = default)
    {
        var dayStart = ToDhakaOffset(fromInclusive);
        var dayEnd = ToDhakaOffset(toExclusive);
        var rows = await db.PunchRecords
            .AsNoTracking()
            .Where(p => p.CompanyId == (long)punchCompanyId && p.PunchTime >= dayStart && p.PunchTime < dayEnd)
            .OrderBy(p => p.PunchTime)
            .ToListAsync(cancellationToken);

        return rows
            .Select(p => new PunchRecordRow(
                Guid.TryParse(p.Id, out var punchId) ? punchId : Guid.Empty,
                (int)p.CompanyId,
                p.PunchNumber,
                p.DeviceId,
                DateTime.SpecifyKind(p.PunchTime.DateTime, DateTimeKind.Unspecified)))
            .ToList();
    }

    private static DateTimeOffset ToDhakaOffset(DateTime value)
    {
        var local = DateTime.SpecifyKind(value, DateTimeKind.Unspecified);
        return new DateTimeOffset(local, TimeSpan.FromHours(6));
    }
}
