using MediatR;
using Microsoft.AspNetCore.Mvc;
using AttendanceService.Application.Features.Attendance.Commands;
using AttendanceService.Application.Features.Attendance.Queries;
using AttendanceService.Application.DTOs;
using AttendanceService.Application;
using AttendanceService.Infrastructure;
using AttendanceService.Infrastructure.Persistence;
using Erp.BuildingBlocks.CommonResponses;

namespace AttendanceService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AttendanceController(IMediator mediator) : ControllerBase
{
    [HttpPost("process")]
    public async Task<ActionResult<ApiResponse<ProcessDailyAttendanceResult>>> Process(ProcessDailyAttendanceCommand command)
    {
        var result = await mediator.Send(command);
        return Ok(ApiResponse<ProcessDailyAttendanceResult>.Ok(result, HttpContext.TraceIdentifier));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<DailyAttendanceDto>>>> Get(
        [FromQuery] Guid companyId,
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] string? employeeID = null)
    {
        var data = await mediator.Send(new GetDailyAttendanceQuery(companyId, fromDate, toDate, employeeID));
        return Ok(ApiResponse<IEnumerable<DailyAttendanceDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPatch("adjust")]
    public async Task<ActionResult<ApiResponse<bool>>> Adjust(ManualAdjustmentCommand command)
    {
        var success = await mediator.Send(command);
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }

    [HttpPatch("{id}/approve")]
    public async Task<ActionResult<ApiResponse<bool>>> Approve(Guid id, [FromQuery] Guid adminId)
    {
        var success = await mediator.Send(new ApproveAttendanceCommand(id, adminId));
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<IEnumerable<AttendanceSummaryDto>>>> GetSummary(
        [FromQuery] Guid companyId,
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] string? employeeID = null)
    {
        var data = await mediator.Send(new GetAttendanceSummaryQuery(companyId, fromDate, toDate, employeeID));
        return Ok(ApiResponse<IEnumerable<AttendanceSummaryDto>>.Ok(data, HttpContext.TraceIdentifier));
    }
}

[ApiController]
[Route("api/v1/[controller]")]
public class PunchLogsController(IMediator mediator) : ControllerBase
{
    [HttpPost("upload")]
    public async Task<ActionResult<ApiResponse<int>>> Upload(UploadPunchLogsCommand command)
    {
        var count = await mediator.Send(command);
        return Ok(ApiResponse<int>.Ok(count, HttpContext.TraceIdentifier));
    }
}
