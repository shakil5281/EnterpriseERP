using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/v1/payroll-periods")]
public sealed class PayrollPeriodsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = PayrollPermissions.PayrollProcess)]
    public async Task<IActionResult> Create(CreatePayrollPeriodRequest request) => Ok(await mediator.Send(new CreatePayrollPeriodCommand(request)));

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid? companyId) => Ok(await mediator.Send(new GetPayrollPeriodQuery(null, companyId)));

    [HttpPatch("{id:guid}/close")]
    [Authorize(Policy = PayrollPermissions.PayrollProcess)]
    public async Task<IActionResult> Close(Guid id, ApprovalRequest request) => Ok(await mediator.Send(new SubmitPayrollCommand(id, request.UserId)));

    [HttpPatch("{id:guid}/lock")]
    [Authorize(Policy = PayrollPermissions.PayrollLock)]
    public async Task<IActionResult> Lock(Guid id, LockPayrollRequest request) => Ok(await mediator.Send(new LockPayrollCommand(id, request.LockedBy, request.Remarks)));

    [HttpPatch("{id:guid}/unlock")]
    [Authorize(Policy = PayrollPermissions.PayrollUnlock)]
    public async Task<IActionResult> Unlock(Guid id, UnlockPayrollRequest request) => Ok(await mediator.Send(new UnlockPayrollCommand(id, request.UnlockedBy, request.UnlockReason)));
}
