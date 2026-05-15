using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/employee-salaries")]
public sealed class EmployeeSalariesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = PayrollPermissions.EmployeeSalaryManage)]
    public async Task<IActionResult> Assign(EmployeeSalaryRequest request) => Ok(await mediator.Send(new AssignEmployeeSalaryCommand(request)));

    [HttpGet("{employeeId:guid}/current")]
    public async Task<IActionResult> Current(Guid employeeId, [FromQuery] Guid companyId) => Ok(await mediator.Send(new GetCurrentEmployeeSalaryQuery(companyId, employeeId)));

    [HttpGet("{employeeId:guid}/history")]
    public async Task<IActionResult> History(Guid employeeId, [FromQuery] Guid companyId) => Ok(await mediator.Send(new GetEmployeeSalaryHistoryQuery(companyId, employeeId)));
}
