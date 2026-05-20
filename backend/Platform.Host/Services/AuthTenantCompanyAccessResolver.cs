using AuthService.Infrastructure.Persistence;
using Erp.BuildingBlocks.CommonSecurity;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseERP.Platform.Host.Services;

public sealed class AuthTenantCompanyAccessResolver(AuthDbContext db) : ITenantCompanyAccessResolver
{
    public async Task<TenantCompanyAccessSnapshot?> GetForUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
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
        return new TenantCompanyAccessSnapshot(ids, defaultId);
    }
}
