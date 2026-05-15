using MediatR;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/v1/payroll-locks")]
public sealed class PayrollLocksController(IMediator mediator) : ControllerBase
{
    [HttpGet("check")]
    public async Task<IActionResult> Check([FromQuery] Guid companyId, [FromQuery] int year, [FromQuery] int month) =>
        Ok(await mediator.Send(new CheckPayrollLockQuery(companyId, year, month)));
}
