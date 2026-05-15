using Erp.BuildingBlocks.Contracts.Pagination;
using CompanyService.Application.Companies;
using CompanyService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CompanyService.Infrastructure.Services;

public sealed class CompanyReadService(CompanyDbContext db) : ICompanyReadService
{
    public async Task<PagedResult<CompanySummaryDto>> ListAsync(PagedRequest request, CancellationToken cancellationToken = default)
    {
        var query = db.Companies.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim();
            query = query.Where(c => 
                c.CompanyNameEn.Contains(s) || 
                (c.CompanyNameBn != null && c.CompanyNameBn.Contains(s)) ||
                c.CompanyCode.Contains(s));
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(c => c.CompanyNameEn)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new CompanySummaryDto 
            { 
                Id = c.Id, 
                CompanyCode = c.CompanyCode,
                CompanyNameEn = c.CompanyNameEn, 
                Status = c.Status 
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<CompanySummaryDto>
        {
            Items = items,
            Page = request.Page,
            PageSize = request.PageSize,
            TotalCount = total,
        };
    }
}
