using Erp.BuildingBlocks.Contracts.Pagination;

namespace CompanyService.Application.Companies;

public interface ICompanyReadService
{
    Task<PagedResult<CompanySummaryDto>> ListAsync(PagedRequest request, CancellationToken cancellationToken = default);
}

public sealed class CompanySummaryDto
{
    public Guid Id { get; init; }
    public string CompanyNameEn { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
}
