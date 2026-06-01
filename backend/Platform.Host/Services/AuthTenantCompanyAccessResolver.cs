using AuthService.Infrastructure.Persistence;
using Erp.BuildingBlocks.CommonSecurity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace EnterpriseERP.Platform.Host.Services;

public sealed class AuthTenantCompanyAccessResolver(AuthDbContext db, IMemoryCache cache) : ITenantCompanyAccessResolver
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(3);

    public async Task<TenantCompanyAccessSnapshot?> GetForUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = $"tenant-company-access:{userId}";
        if (cache.TryGetValue(cacheKey, out TenantCompanyAccessSnapshot? cached))
        {
            return cached;
        }

        var rows = await db.UserCompanyAccesses.AsNoTracking()
            .Where(x => x.UserId == userId && x.IsActive && !x.IsDeleted && x.CompanyGuid != Guid.Empty)
            .OrderByDescending(x => x.IsDefaultCompany)
            .ThenBy(x => x.CompanyGuid)
            .Select(x => new { x.CompanyGuid, x.IsDefaultCompany })
            .ToListAsync(cancellationToken);

        if (rows.Count == 0)
        {
            return null;
        }

        var ids = rows.Select(x => x.CompanyGuid).Distinct().ToList();
        var defaultId = rows.FirstOrDefault(x => x.IsDefaultCompany)?.CompanyGuid ?? ids[0];
        var snapshot = new TenantCompanyAccessSnapshot(ids, defaultId);
        cache.Set(cacheKey, snapshot, CacheTtl);
        return snapshot;
    }
}
