using Erp.BuildingBlocks.CommonResponses;
using Erp.BuildingBlocks.Contracts.Pagination;
using HRService.Application.Employees;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HRService.Api.Controllers;

[ApiController]
[Route("api/v1/hr/[controller]")]
[Authorize]
public sealed class EmployeesController(
    IEmployeeReadService employees,
    IEmployeeService employeeService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<EmployeeListItemDto>>>> List(
        [FromQuery] EmployeeListQuery query,
        CancellationToken cancellationToken)
    {
        var data = await employees.ListAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<EmployeeListItemDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("manpower")]
    public async Task<ActionResult<ApiResponse<PagedResult<ManpowerListItemDto>>>> ManpowerList(
        [FromQuery] ManpowerListQuery query,
        CancellationToken cancellationToken)
    {
        var data = await employees.ManpowerListAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<ManpowerListItemDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("manpower/summary")]
    public async Task<ActionResult<ApiResponse<ManpowerSummaryDto>>> ManpowerSummary(
        [FromQuery] ManpowerSummaryQuery query,
        CancellationToken cancellationToken)
    {
        var data = await employees.ManpowerSummaryAsync(query, cancellationToken);
        return Ok(ApiResponse<ManpowerSummaryDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("transfers")]
    public async Task<ActionResult<ApiResponse<PagedResult<EmployeeTransferDto>>>> ListTransfers(
        [FromQuery] EmployeeTransferListQuery query,
        CancellationToken cancellationToken)
    {
        var data = await employees.ListTransfersAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<EmployeeTransferDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<EmployeeDetailsDto>>> Get(
        Guid id,
        CancellationToken cancellationToken)
    {
        var data = await employees.GetByIdAsync(id, cancellationToken);
        if (data == null)
        {
            return NotFound(ApiResponse<EmployeeDetailsDto>.Fail(
                HttpContext.TraceIdentifier,
                [new ApiError("NotFound", "Employee not found")]));
        }
        return Ok(ApiResponse<EmployeeDetailsDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id}/status-history")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EmployeeStatusHistoryDto>>>> StatusHistory(
        Guid id,
        CancellationToken cancellationToken)
    {
        var data = await employees.GetStatusHistoryAsync(id, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<EmployeeStatusHistoryDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id}/transfers")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EmployeeTransferDto>>>> EmployeeTransfers(
        Guid id,
        CancellationToken cancellationToken)
    {
        var data = await employees.GetEmployeeTransfersAsync(id, cancellationToken);
        return Ok(ApiResponse<IReadOnlyList<EmployeeTransferDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create(
        [FromBody] CreateEmployeeDto dto,
        CancellationToken cancellationToken)
    {
        var id = await employeeService.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id }, ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<string>>> Update(
        Guid id,
        [FromBody] UpdateEmployeeDto dto,
        CancellationToken cancellationToken)
    {
        await employeeService.UpdateAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Employee updated successfully", HttpContext.TraceIdentifier));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<string>>> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        await employeeService.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Employee deleted successfully", HttpContext.TraceIdentifier));
    }

    // Advanced Operations

    [HttpPost("{id}/transfer")]
    public async Task<ActionResult<ApiResponse<string>>> Transfer(
        Guid id,
        [FromBody] TransferEmployeeDto dto,
        CancellationToken cancellationToken)
    {
        await employeeService.TransferAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Employee transfer processed", HttpContext.TraceIdentifier));
    }

    [HttpPost("{id}/status")]
    public async Task<ActionResult<ApiResponse<string>>> ChangeStatus(
        Guid id,
        [FromBody] ChangeStatusDto dto,
        CancellationToken cancellationToken)
    {
        await employeeService.ChangeStatusAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<string>.Ok($"Employee status changed to {dto.Status}", HttpContext.TraceIdentifier));
    }

    [HttpPost("{id}/salary")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateSalary(
        Guid id,
        [FromBody] UpdateSalaryDto dto,
        CancellationToken cancellationToken)
    {
        await employeeService.UpdateSalaryAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Employee salary updated", HttpContext.TraceIdentifier));
    }

    // Sub-Resources (Addresses, Bank, Contacts, Docs)

    [HttpPost("{id}/addresses")]
    public async Task<ActionResult<ApiResponse<string>>> AddAddress(Guid id, [FromBody] EmployeeAddressDto dto)
    {
        await employeeService.AddAddressAsync(id, dto);
        return Ok(ApiResponse<string>.Ok("Address added", HttpContext.TraceIdentifier));
    }

    [HttpPut("addresses/{addressId}")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateAddress(Guid addressId, [FromBody] EmployeeAddressDto dto)
    {
        await employeeService.UpdateAddressAsync(addressId, dto);
        return Ok(ApiResponse<string>.Ok("Address updated", HttpContext.TraceIdentifier));
    }

    [HttpDelete("addresses/{addressId}")]
    public async Task<ActionResult<ApiResponse<string>>> DeleteAddress(Guid addressId)
    {
        await employeeService.DeleteAddressAsync(addressId);
        return Ok(ApiResponse<string>.Ok("Address deleted", HttpContext.TraceIdentifier));
    }

    [HttpPost("{id}/bank-accounts")]
    public async Task<ActionResult<ApiResponse<string>>> AddBankAccount(Guid id, [FromBody] EmployeeBankAccountDto dto)
    {
        await employeeService.AddBankAccountAsync(id, dto);
        return Ok(ApiResponse<string>.Ok("Bank account added", HttpContext.TraceIdentifier));
    }

    [HttpPut("bank-accounts/{accountId}")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateBankAccount(Guid accountId, [FromBody] EmployeeBankAccountDto dto)
    {
        await employeeService.UpdateBankAccountAsync(accountId, dto);
        return Ok(ApiResponse<string>.Ok("Bank account updated", HttpContext.TraceIdentifier));
    }

    [HttpDelete("bank-accounts/{accountId}")]
    public async Task<ActionResult<ApiResponse<string>>> DeleteBankAccount(Guid accountId)
    {
        await employeeService.DeleteBankAccountAsync(accountId);
        return Ok(ApiResponse<string>.Ok("Bank account deleted", HttpContext.TraceIdentifier));
    }

    [HttpPost("{id}/emergency-contacts")]
    public async Task<ActionResult<ApiResponse<string>>> AddEmergencyContact(Guid id, [FromBody] EmergencyContactDto dto)
    {
        await employeeService.AddEmergencyContactAsync(id, dto);
        return Ok(ApiResponse<string>.Ok("Emergency contact added", HttpContext.TraceIdentifier));
    }

    [HttpPut("emergency-contacts/{contactId}")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateEmergencyContact(Guid contactId, [FromBody] EmergencyContactDto dto)
    {
        await employeeService.UpdateEmergencyContactAsync(contactId, dto);
        return Ok(ApiResponse<string>.Ok("Emergency contact updated", HttpContext.TraceIdentifier));
    }

    [HttpDelete("emergency-contacts/{contactId}")]
    public async Task<ActionResult<ApiResponse<string>>> DeleteEmergencyContact(Guid contactId)
    {
        await employeeService.DeleteEmergencyContactAsync(contactId);
        return Ok(ApiResponse<string>.Ok("Emergency contact deleted", HttpContext.TraceIdentifier));
    }

    [HttpPost("{id}/documents")]
    public async Task<ActionResult<ApiResponse<string>>> AddDocument(Guid id, [FromBody] EmployeeDocumentDto dto)
    {
        await employeeService.AddDocumentAsync(id, dto);
        return Ok(ApiResponse<string>.Ok("Document added", HttpContext.TraceIdentifier));
    }

    [HttpDelete("documents/{documentId}")]
    public async Task<ActionResult<ApiResponse<string>>> DeleteDocument(Guid documentId)
    {
        await employeeService.DeleteDocumentAsync(documentId);
        return Ok(ApiResponse<string>.Ok("Document deleted", HttpContext.TraceIdentifier));
    }
}
