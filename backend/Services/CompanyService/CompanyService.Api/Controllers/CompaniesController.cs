using Erp.BuildingBlocks.CommonResponses;
using Erp.BuildingBlocks.Contracts.Pagination;
using CompanyService.Application.Companies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CompanyService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public sealed class CompaniesController(
    ICompanyReadService companyRead,
    ICompanyService companyService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<CompanySummaryDto>>>> List(
        [FromQuery] PagedRequest request,
        CancellationToken cancellationToken)
    {
        var data = await companyRead.ListAsync(request, cancellationToken);
        return Ok(ApiResponse<PagedResult<CompanySummaryDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<CompanyDetailsDto>>> Get(
        Guid id,
        CancellationToken cancellationToken)
    {
        var data = await companyService.GetByIdAsync(id, cancellationToken);
        if (data == null)
        {
            return NotFound(ApiResponse<CompanyDetailsDto>.Fail(
                HttpContext.TraceIdentifier,
                [new ApiError("NotFound", "Company not found")]));
        }
        return Ok(ApiResponse<CompanyDetailsDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create(
        [FromBody] CreateCompanyDto dto,
        CancellationToken cancellationToken)
    {
        var id = await companyService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id }, ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<string>>> Update(
        Guid id,
        [FromBody] UpdateCompanyDto dto,
        CancellationToken cancellationToken)
    {
        await companyService.UpdateAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Company updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<string>>> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        await companyService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Company deleted successfully", HttpContext.TraceIdentifier));
    }
}
