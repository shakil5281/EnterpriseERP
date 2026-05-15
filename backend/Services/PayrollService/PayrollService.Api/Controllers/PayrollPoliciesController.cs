using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/payroll-policies")]
public sealed class PayrollPoliciesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = PayrollPermissions.PayrollPolicyManage)]
    public async Task<IActionResult> Create(CreatePayrollPolicyRequest request) => Ok(await mediator.Send(new CreatePayrollPolicyCommand(request)));

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid? companyId) => Ok(await mediator.Send(new GetPayrollPolicyQuery(null, companyId)));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id) => Ok(await mediator.Send(new GetPayrollPolicyQuery(id, null)));

    [HttpPut("{id:guid}")]
    [Authorize(Policy = PayrollPermissions.PayrollPolicyManage)]
    public async Task<IActionResult> Update(Guid id, UpdatePayrollPolicyRequest request) => Ok(await mediator.Send(new UpdatePayrollPolicyCommand(id, request)));

    [HttpPatch("{id:guid}/activate")]
    [Authorize(Policy = PayrollPermissions.PayrollPolicyManage)]
    public async Task<IActionResult> Activate(Guid id) => Ok(await mediator.Send(new SetPayrollPolicyActiveCommand(id, true)));

    [HttpPatch("{id:guid}/deactivate")]
    [Authorize(Policy = PayrollPermissions.PayrollPolicyManage)]
    public async Task<IActionResult> Deactivate(Guid id) => Ok(await mediator.Send(new SetPayrollPolicyActiveCommand(id, false)));
}
