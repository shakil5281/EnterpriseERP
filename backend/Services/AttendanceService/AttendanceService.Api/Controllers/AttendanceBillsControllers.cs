using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using Erp.BuildingBlocks.CommonResponses;
using Microsoft.AspNetCore.Mvc;

namespace AttendanceService.Api.Controllers;

public abstract class AttendanceBillsControllerBase(IAttendanceBillService bills, string billType) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<BillResponseDto>>> List(
        [FromQuery] Guid companyId,
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] Guid? departmentId = null,
        [FromQuery] string? employeeType = null,
        [FromQuery] string? searchTerm = null)
    {
        var data = await bills.GetAsync(
            billType,
            new BillQuery(companyId, fromDate, toDate, departmentId, employeeType, searchTerm));
        return Ok(ApiResponse<BillResponseDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("process")]
    public async Task<ActionResult<ApiResponse<int>>> Process([FromBody] ProcessBillsRequest request)
    {
        var count = await bills.ProcessAsync(billType, request);
        return Ok(ApiResponse<int>.Ok(count, HttpContext.TraceIdentifier));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var ok = await bills.DeleteAsync(billType, id);
        return Ok(ApiResponse<bool>.Ok(ok, HttpContext.TraceIdentifier));
    }

    [HttpPost("delete-multiple")]
    public async Task<ActionResult<ApiResponse<int>>> DeleteMultiple([FromBody] DeleteMultipleBillsRequest request)
    {
        var count = await bills.DeleteMultipleAsync(billType, request.Ids);
        return Ok(ApiResponse<int>.Ok(count, HttpContext.TraceIdentifier));
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] Guid companyId,
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] Guid? departmentId = null,
        [FromQuery] string? employeeType = null,
        [FromQuery] string? searchTerm = null)
    {
        var bytes = await bills.ExportCsvAsync(
            billType,
            new BillQuery(companyId, fromDate, toDate, departmentId, employeeType, searchTerm));
        return File(bytes, "text/csv", $"{billType.ToLowerInvariant()}-bills-{fromDate:yyyyMMdd}.csv");
    }
}

[ApiController]
[Route("api/v1/night-bills")]
public sealed class NightBillsController(IAttendanceBillService bills)
    : AttendanceBillsControllerBase(bills, "Night");

[ApiController]
[Route("api/v1/tiffin-bills")]
public sealed class TiffinBillsController(IAttendanceBillService bills)
    : AttendanceBillsControllerBase(bills, "Tiffin");

[ApiController]
[Route("api/v1/ifter-bills")]
public sealed class IfterBillsController(IAttendanceBillService bills)
    : AttendanceBillsControllerBase(bills, "Ifter");
