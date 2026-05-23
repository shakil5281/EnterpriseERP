using System.Text;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/v1/payroll/export")]
public sealed class PayrollExportsController(IMediator mediator) : ControllerBase
{
    [HttpGet("salary-sheet")]
    [Authorize(Policy = PayrollPermissions.SalarySheetView)]
    public async Task<IActionResult> SalarySheet(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo,
        CancellationToken cancellationToken)
    {
        var response = await mediator.Send(new GetSalarySheetQuery(companyId, yearNo, monthNo), cancellationToken);
        if (!response.Success || response.Data is null)
        {
            return BadRequest(response);
        }

        return CsvFile(
            "salary-sheet.csv",
            ["EmployeeCode", "EmployeeName", "Department", "Designation", "Gross", "Basic", "Earnings", "Deduction", "Net", "Status"],
            response.Data.Select(x => new[]
            {
                x.EmployeeCode ?? "",
                x.EmployeeName ?? "",
                x.DepartmentName ?? "",
                x.DesignationName ?? "",
                x.GrossSalary.ToString("0.00"),
                x.BasicSalary.ToString("0.00"),
                x.TotalEarnings.ToString("0.00"),
                x.TotalDeduction.ToString("0.00"),
                x.NetSalary.ToString("0.00"),
                x.Status
            }));
    }

    [HttpGet("bank-sheet")]
    [Authorize(Policy = PayrollPermissions.BankSheetExport)]
    public async Task<IActionResult> BankSheet(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo,
        CancellationToken cancellationToken)
    {
        var response = await mediator.Send(new GetBankSheetQuery(companyId, yearNo, monthNo), cancellationToken);
        if (!response.Success || response.Data is null)
        {
            return BadRequest(response);
        }

        return CsvFile(
            "bank-sheet.csv",
            ["EmployeeId", "BankAccountNo", "BankName", "NetSalary"],
            response.Data.Select(x => new[] { x.EmployeeId.ToString(), x.BankAccountNo, x.BankName, x.NetSalary.ToString("0.00") }));
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo,
        [FromQuery] string format = "xlsx",
        CancellationToken cancellationToken = default)
    {
        var response = await mediator.Send(new GetPayrollSummaryBreakdownQuery(companyId, yearNo, monthNo), cancellationToken);
        if (!response.Success || response.Data is null)
        {
            return BadRequest(response);
        }

        var rows = response.Data.DepartmentSummaries.Select(x => new[]
        {
            x.Name,
            x.EmployeeCount.ToString(),
            x.TotalGrossSalary.ToString("0.00"),
            x.TotalOTAmount.ToString("0.00"),
            x.TotalDeductions.ToString("0.00"),
            x.TotalNetPayable.ToString("0.00")
        });

        var fileName = format.Equals("pdf", StringComparison.OrdinalIgnoreCase) ? "summary.csv" : "summary.csv";
        return CsvFile(fileName, ["Department", "Employees", "Gross", "OT", "Deductions", "Net"], rows);
    }

    [HttpGet("advance-sheet")]
    public async Task<IActionResult> AdvanceSheet([FromQuery] Guid companyId, [FromQuery] int? year, [FromQuery] int? month, CancellationToken cancellationToken)
    {
        var response = await mediator.Send(new ListSalaryAdvancesQuery(companyId, null, year, month), cancellationToken);
        if (!response.Success || response.Data is null)
        {
            return BadRequest(response);
        }

        return CsvFile(
            "advance-sheet.csv",
            ["AdvanceNo", "EmployeeId", "Amount", "Balance", "Status", "AdvanceDate"],
            response.Data.Select(x => new[]
            {
                x.AdvanceNo,
                x.EmployeeId.ToString(),
                x.AdvanceAmount.ToString("0.00"),
                x.BalanceAmount.ToString("0.00"),
                x.Status,
                x.AdvanceDate.ToString("yyyy-MM-dd")
            }));
    }

    [HttpGet("daily-sheet")]
    public async Task<IActionResult> DailySheet([FromQuery] Guid companyId, [FromQuery] DateOnly date, CancellationToken cancellationToken)
    {
        var response = await mediator.Send(new GetDailySalarySheetQuery(companyId, date, null, null), cancellationToken);
        if (!response.Success || response.Data is null)
        {
            return BadRequest(response);
        }

        return CsvFile(
            "daily-sheet.csv",
            ["EmployeeCode", "EmployeeName", "Date", "PerDay", "OT", "Earning", "Deduction", "Net"],
            response.Data.Select(x => new[]
            {
                x.EmployeeCode ?? "",
                x.EmployeeName ?? "",
                x.Date.ToString("yyyy-MM-dd"),
                x.PerDaySalary.ToString("0.00"),
                x.OtAmount.ToString("0.00"),
                x.TotalEarning.ToString("0.00"),
                x.Deduction.ToString("0.00"),
                x.NetPayable.ToString("0.00")
            }));
    }

    [HttpGet("bonuses")]
    public async Task<IActionResult> Bonuses([FromQuery] Guid companyId, [FromQuery] int year, [FromQuery] int? month, CancellationToken cancellationToken)
    {
        var response = await mediator.Send(new GetPayrollBonusesQuery(companyId, year, month, null), cancellationToken);
        if (!response.Success || response.Data is null)
        {
            return BadRequest(response);
        }

        return CsvFile(
            "bonuses.csv",
            ["EmployeeId", "EmployeeName", "BonusType", "Amount", "Status"],
            response.Data.Select(x => new[]
            {
                x.EmployeeId.ToString(),
                x.EmployeeName ?? "",
                x.BonusType,
                x.Amount.ToString("0.00"),
                x.Status
            }));
    }

    private static FileContentResult CsvFile(string fileName, IReadOnlyList<string> headers, IEnumerable<string[]> rows)
    {
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(',', headers.Select(Escape)));
        foreach (var row in rows)
        {
            sb.AppendLine(string.Join(',', row.Select(Escape)));
        }

        return new FileContentResult(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv")
        {
            FileDownloadName = fileName
        };
    }

    private static string Escape(string value) => $"\"{value.Replace("\"", "\"\"")}\"";
}
