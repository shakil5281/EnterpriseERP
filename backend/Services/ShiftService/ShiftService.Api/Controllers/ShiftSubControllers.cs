using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShiftService.Api.Models;
using ShiftService.Application.Features.Shifts.Commands;

namespace ShiftService.Api.Controllers;

[ApiController]
[Route("api/shifts/{shiftId}/rules")]
public class ShiftRulesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create(Guid shiftId, CreateShiftRuleCommand command)
    {
        if (shiftId != command.ShiftId) return BadRequest(ApiResponse<Guid>.Fail(["Shift ID mismatch"], HttpContext.TraceIdentifier));
        var id = await mediator.Send(command);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut]
    public async Task<ActionResult<ApiResponse<bool>>> Update(Guid shiftId, UpdateShiftRuleCommand command)
    {
        var success = await mediator.Send(command);
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }
}

[ApiController]
[Route("api/shifts/{shiftId}/breaks")]
public class ShiftBreaksController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create(Guid shiftId, CreateShiftBreakCommand command)
    {
        if (shiftId != command.ShiftId) return BadRequest(ApiResponse<Guid>.Fail(["Shift ID mismatch"], HttpContext.TraceIdentifier));
        var id = await mediator.Send(command);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("{breakId}")]
    public async Task<ActionResult<ApiResponse<bool>>> Update(Guid shiftId, Guid breakId, UpdateShiftBreakCommand command)
    {
        if (breakId != command.Id) return BadRequest(ApiResponse<bool>.Fail(["Break ID mismatch"], HttpContext.TraceIdentifier));
        var success = await mediator.Send(command);
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }

    [HttpDelete("{breakId}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid shiftId, Guid breakId)
    {
        var success = await mediator.Send(new DeleteShiftBreakCommand(breakId));
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }
}
