using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/v1/salary-advances")]
public sealed class SalaryAdvancesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = PayrollPermissions.SalaryAdvanceRequest)]
    public async Task<IActionResult> Create(SalaryAdvanceRequest request) => Ok(await mediator.Send(new CreateSalaryAdvanceCommand(request)));

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, [FromQuery] Guid employeeId) => Ok(await mediator.Send(new GetSalaryAdvanceBalanceQuery(companyId, employeeId)));

    [HttpPatch("{id:guid}/approve")]
    [Authorize(Policy = PayrollPermissions.SalaryAdvanceApprove)]
    public async Task<IActionResult> Approve(Guid id, ApprovalRequest request) => Ok(await mediator.Send(new ApproveSalaryAdvanceCommand(id, request.UserId)));

    [HttpPatch("{id:guid}/reject")]
    [Authorize(Policy = PayrollPermissions.SalaryAdvanceApprove)]
    public async Task<IActionResult> Reject(Guid id, ApprovalRequest request) => Ok(await mediator.Send(new RejectSalaryAdvanceCommand(id, request.UserId, request.Remarks)));

    [HttpGet("{employeeId:guid}/balance")]
    public async Task<IActionResult> Balance(Guid employeeId, [FromQuery] Guid companyId) => Ok(await mediator.Send(new GetSalaryAdvanceBalanceQuery(companyId, employeeId)));
}
