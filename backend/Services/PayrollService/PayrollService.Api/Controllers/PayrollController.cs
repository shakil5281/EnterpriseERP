using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Api.Controllers;

[ApiController]
public sealed class PayrollController(IMediator mediator) : ControllerBase
{
    [HttpPost("api/v1/payroll/process")]
    [Authorize(Policy = PayrollPermissions.PayrollProcess)]
    public async Task<IActionResult> Process(ProcessPayrollRequest request) => Ok(await mediator.Send(new ProcessPayrollCommand(request)));

    [HttpPost("api/v1/payroll/reprocess")]
    [Authorize(Policy = PayrollPermissions.PayrollReprocess)]
    public async Task<IActionResult> Reprocess(ProcessPayrollRequest request) => Ok(await mediator.Send(new ReprocessPayrollCommand(request)));

    [HttpGet("api/v1/payroll/{periodId:guid}")]
    public async Task<IActionResult> Get(
        Guid periodId,
        [FromQuery] int? departmentId,
        [FromQuery] int? sectionId,
        [FromQuery] int? designationId,
        [FromQuery] int? lineId,
        [FromQuery] string? status,
        [FromQuery] string? searchTerm) =>
        Ok(await mediator.Send(new GetEmployeePayrollQuery(periodId, null, departmentId, sectionId, designationId, lineId, status, searchTerm)));

    [HttpGet("api/v1/payroll/{periodId:guid}/employees/{employeeId:guid}")]
    public async Task<IActionResult> GetEmployee(Guid periodId, Guid employeeId) =>
        Ok(await mediator.Send(new GetEmployeePayrollQuery(periodId, employeeId)));

    [HttpGet("api/v1/payroll/{periodId:guid}/summary")]
    public async Task<IActionResult> Summary(Guid periodId) =>
        Ok(await mediator.Send(new GetPayrollSummaryQuery(periodId)));

    [HttpGet("api/v1/payroll/{periodId:guid}/summary/breakdown")]
    public async Task<IActionResult> SummaryBreakdown(Guid periodId) =>
        Ok(await mediator.Send(new GetPayrollSummaryBreakdownQuery(periodId)));

    [HttpGet("api/v1/payroll/{periodId:guid}/salary-sheet")]
    [Authorize(Policy = PayrollPermissions.SalarySheetView)]
    public async Task<IActionResult> SalarySheet(
        Guid periodId,
        [FromQuery] int? departmentId,
        [FromQuery] int? sectionId,
        [FromQuery] int? designationId,
        [FromQuery] int? lineId,
        [FromQuery] string? status,
        [FromQuery] string? searchTerm) =>
        Ok(await mediator.Send(new GetSalarySheetQuery(periodId, departmentId, sectionId, designationId, lineId, status, searchTerm)));

    [HttpGet("api/v1/payroll/{periodId:guid}/bank-sheet")]
    [Authorize(Policy = PayrollPermissions.BankSheetExport)]
    public async Task<IActionResult> BankSheet(Guid periodId) => Ok(await mediator.Send(new GetBankSheetQuery(periodId)));

    [HttpGet("api/v1/payroll/{periodId:guid}/payslips")]
    [Authorize(Policy = PayrollPermissions.PayslipView)]
    public async Task<IActionResult> Payslips(Guid periodId) => Ok(await mediator.Send(new GetEmployeePayrollQuery(periodId, null)));

    [HttpGet("api/v1/payroll/{periodId:guid}/payslips/{employeeId:guid}")]
    [Authorize(Policy = PayrollPermissions.PayslipView)]
    public async Task<IActionResult> Payslip(Guid periodId, Guid employeeId) => Ok(await mediator.Send(new GetPayslipQuery(periodId, employeeId)));

    [HttpPost("api/v1/payroll/{periodId:guid}/submit")]
    [Authorize(Policy = PayrollPermissions.PayrollProcess)]
    public async Task<IActionResult> Submit(Guid periodId, ApprovalRequest request) => Ok(await mediator.Send(new SubmitPayrollCommand(periodId, request.UserId)));

    [HttpPatch("api/v1/payroll/{periodId:guid}/approve")]
    [Authorize(Policy = PayrollPermissions.PayrollApprove)]
    public async Task<IActionResult> Approve(Guid periodId, ApprovalRequest request) => Ok(await mediator.Send(new ApprovePayrollCommand(periodId, request.UserId, request.Remarks)));

    [HttpPatch("api/v1/payroll/{periodId:guid}/reject")]
    [Authorize(Policy = PayrollPermissions.PayrollApprove)]
    public async Task<IActionResult> Reject(Guid periodId, ApprovalRequest request) => Ok(await mediator.Send(new RejectPayrollCommand(periodId, request.UserId, request.Remarks)));
}
