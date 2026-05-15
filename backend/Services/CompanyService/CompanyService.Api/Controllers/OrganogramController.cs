using Microsoft.AspNetCore.Mvc;
using CompanyService.Application.Organogram;
using Erp.BuildingBlocks.CommonResponses;

namespace CompanyService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class OrganogramController(IOrganogramService organogramService) : ControllerBase
{
    // Departments
    [HttpGet("companies/{companyId}/departments")]
    public async Task<IActionResult> GetDepartments(Guid companyId)
    {
        var data = await organogramService.GetDepartmentsAsync(companyId);
        return Ok(ApiResponse<IEnumerable<DepartmentDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    /// <summary>Legacy/query list: GET .../Organogram/departments?companyId= (optional — all companies when omitted).</summary>
    [HttpGet("departments")]
    public async Task<IActionResult> ListDepartments([FromQuery] Guid? companyId, CancellationToken cancellationToken)
    {
        if (companyId.HasValue)
        {
            var scoped = await organogramService.GetDepartmentsAsync(companyId.Value);
            return Ok(ApiResponse<IEnumerable<DepartmentDto>>.Ok(scoped, HttpContext.TraceIdentifier));
        }

        var all = await organogramService.GetAllDepartmentsAsync(cancellationToken);
        return Ok(ApiResponse<IEnumerable<DepartmentDto>>.Ok(all, HttpContext.TraceIdentifier));
    }

    [HttpPost("departments")]
    public async Task<IActionResult> CreateDepartment(DepartmentDto dto)
    {
        var id = await organogramService.CreateDepartmentAsync(dto);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("departments")]
    public async Task<IActionResult> UpdateDepartment(DepartmentDto dto)
    {
        await organogramService.UpdateDepartmentAsync(dto);
        return Ok(ApiResponse<string>.Ok("Department updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("departments/{id}")]
    public async Task<IActionResult> DeleteDepartment(Guid id)
    {
        await organogramService.DeleteDepartmentAsync(id);
        return Ok(ApiResponse<string>.Ok("Department deleted successfully", HttpContext.TraceIdentifier));
    }

    // Sections
    [HttpGet("departments/{departmentId}/sections")]
    public async Task<IActionResult> GetSections(Guid departmentId)
    {
        var data = await organogramService.GetSectionsAsync(departmentId);
        return Ok(ApiResponse<IEnumerable<SectionDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    /// <summary>Legacy/query list: GET .../Organogram/sections?departmentId= or ?companyId= (optional — all when both omitted).</summary>
    [HttpGet("sections")]
    public async Task<IActionResult> ListSections(
        [FromQuery] Guid? departmentId,
        [FromQuery] Guid? companyId,
        CancellationToken cancellationToken)
    {
        if (departmentId.HasValue)
        {
            var scoped = await organogramService.GetSectionsAsync(departmentId.Value);
            return Ok(ApiResponse<IEnumerable<SectionDto>>.Ok(scoped, HttpContext.TraceIdentifier));
        }

        if (companyId.HasValue)
        {
            var byCompany = await organogramService.GetSectionsForCompanyAsync(companyId.Value, cancellationToken);
            return Ok(ApiResponse<IEnumerable<SectionDto>>.Ok(byCompany, HttpContext.TraceIdentifier));
        }

        var all = await organogramService.GetAllSectionsAsync(cancellationToken);
        return Ok(ApiResponse<IEnumerable<SectionDto>>.Ok(all, HttpContext.TraceIdentifier));
    }

    [HttpPost("sections")]
    public async Task<IActionResult> CreateSection(SectionDto dto)
    {
        var id = await organogramService.CreateSectionAsync(dto);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("sections")]
    public async Task<IActionResult> UpdateSection(SectionDto dto)
    {
        await organogramService.UpdateSectionAsync(dto);
        return Ok(ApiResponse<string>.Ok("Section updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("sections/{id}")]
    public async Task<IActionResult> DeleteSection(Guid id)
    {
        await organogramService.DeleteSectionAsync(id);
        return Ok(ApiResponse<string>.Ok("Section deleted successfully", HttpContext.TraceIdentifier));
    }

    // Designations
    [HttpGet("sections/{sectionId}/designations")]
    public async Task<IActionResult> GetDesignations(Guid sectionId)
    {
        var data = await organogramService.GetDesignationsAsync(sectionId);
        return Ok(ApiResponse<IEnumerable<DesignationDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("designations")]
    public async Task<IActionResult> CreateDesignation(DesignationDto dto)
    {
        var id = await organogramService.CreateDesignationAsync(dto);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("designations")]
    public async Task<IActionResult> UpdateDesignation(DesignationDto dto)
    {
        await organogramService.UpdateDesignationAsync(dto);
        return Ok(ApiResponse<string>.Ok("Designation updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("designations/{id}")]
    public async Task<IActionResult> DeleteDesignation(Guid id)
    {
        await organogramService.DeleteDesignationAsync(id);
        return Ok(ApiResponse<string>.Ok("Designation deleted successfully", HttpContext.TraceIdentifier));
    }

    // Lines
    [HttpGet("sections/{sectionId}/lines")]
    public async Task<IActionResult> GetLines(Guid sectionId)
    {
        var data = await organogramService.GetLinesAsync(sectionId);
        return Ok(ApiResponse<IEnumerable<LineDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("lines")]
    public async Task<IActionResult> CreateLine(LineDto dto)
    {
        var id = await organogramService.CreateLineAsync(dto);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("lines")]
    public async Task<IActionResult> UpdateLine(LineDto dto)
    {
        await organogramService.UpdateLineAsync(dto);
        return Ok(ApiResponse<string>.Ok("Line updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("lines/{id}")]
    public async Task<IActionResult> DeleteLine(Guid id)
    {
        await organogramService.DeleteLineAsync(id);
        return Ok(ApiResponse<string>.Ok("Line deleted successfully", HttpContext.TraceIdentifier));
    }
}
