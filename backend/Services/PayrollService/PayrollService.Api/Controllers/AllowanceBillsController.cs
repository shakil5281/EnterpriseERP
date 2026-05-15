using MediatR;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/v1/allowance-bills")]
public sealed class AllowanceBillsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(AllowanceBillRequest request) => Ok(await mediator.Send(new CreateAllowanceBillCommand(request)));

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, [FromQuery] Guid? employeeId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate) =>
        Ok(await mediator.Send(new GetAllowanceBillsQuery(companyId, employeeId, fromDate, toDate)));

    [HttpPatch("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, ApprovalRequest request) => Ok(await mediator.Send(new ApproveAllowanceBillCommand(id, request.UserId)));

    [HttpPatch("{id:guid}/reject")]
    public async Task<IActionResult> Reject(Guid id, ApprovalRequest request) => Ok(await mediator.Send(new RejectAllowanceBillCommand(id, request.UserId, request.Remarks)));
}
