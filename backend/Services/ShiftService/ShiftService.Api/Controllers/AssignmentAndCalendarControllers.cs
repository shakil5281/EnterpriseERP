using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShiftService.Api.Models;
using ShiftService.Application.Features.Shifts.Commands;
using ShiftService.Application.Features.Shifts.Queries;
using ShiftService.Application.DTOs;

namespace ShiftService.Api.Controllers;

[ApiController]
[Route("api/employee-shifts")]
public class EmployeeShiftsController(IMediator mediator) : ControllerBase
{
    [HttpPost("assign")]
    public async Task<ActionResult<ApiResponse<Guid>>> Assign(AssignEmployeeShiftCommand command)
    {
        var id = await mediator.Send(command);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpGet("{employeeId}/current")]
    public async Task<ActionResult<ApiResponse<EmployeeShiftAssignmentDto>>> GetCurrent(Guid employeeId, [FromQuery] Guid companyId)
    {
        var data = await mediator.Send(new GetCurrentEmployeeShiftQuery(employeeId, companyId));
        if (data == null) return NotFound(ApiResponse<EmployeeShiftAssignmentDto>.Fail(["No current shift found"], HttpContext.TraceIdentifier));
        return Ok(ApiResponse<EmployeeShiftAssignmentDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("{employeeId}/history")]
    public async Task<ActionResult<ApiResponse<IEnumerable<EmployeeShiftAssignmentDto>>>> GetHistory(Guid employeeId, [FromQuery] Guid companyId)
    {
        var data = await mediator.Send(new GetEmployeeShiftHistoryQuery(employeeId, companyId));
        return Ok(ApiResponse<IEnumerable<EmployeeShiftAssignmentDto>>.Ok(data, HttpContext.TraceIdentifier));
    }
}

[ApiController]
[Route("api/temporary-shifts")]
public class TemporaryShiftsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Assign(AssignTemporaryShiftCommand command)
    {
        var id = await mediator.Send(command);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<TemporaryShiftAssignmentDto>>> GetByDate([FromQuery] Guid companyId, [FromQuery] Guid employeeId, [FromQuery] DateTime date)
    {
        var data = await mediator.Send(new GetTemporaryShiftByDateQuery(employeeId, companyId, date));
        if (data == null) return NotFound(ApiResponse<TemporaryShiftAssignmentDto>.Fail(["No temporary shift found for this date"], HttpContext.TraceIdentifier));
        return Ok(ApiResponse<TemporaryShiftAssignmentDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id)
    {
        var success = await mediator.Send(new DeleteTemporaryShiftCommand(id));
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }
}

[ApiController]
[Route("api/shift-calendars")]
public class ShiftCalendarsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create(CreateShiftCalendarCommand command)
    {
        var id = await mediator.Send(command);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<ShiftCalendarDto>>>> Get([FromQuery] Guid companyId, [FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
    {
        var data = await mediator.Send(new GetShiftCalendarQuery(companyId, fromDate, toDate));
        return Ok(ApiResponse<IEnumerable<ShiftCalendarDto>>.Ok(data, HttpContext.TraceIdentifier));
    }
}
