using System.Net.Http.Json;
using PayrollService.Application;

namespace PayrollService.Infrastructure.ExternalServices;

public sealed class EmployeeServiceClient(HttpClient httpClient) : IEmployeeServiceClient
{
    public async Task<IReadOnlyList<EmployeeSnapshot>> GetActiveEmployeesAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        return await httpClient.GetFromJsonAsync<IReadOnlyList<EmployeeSnapshot>>($"/api/v1/employees/active?companyId={companyId}", cancellationToken)
            ?? Array.Empty<EmployeeSnapshot>();
    }

    public async Task<EmployeeSnapshot?> GetEmployeeByIdAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default)
    {
        return await httpClient.GetFromJsonAsync<EmployeeSnapshot?>($"/api/v1/employees/{employeeId}?companyId={companyId}", cancellationToken);
    }

    public async Task<DateOnly?> GetEmployeeJoinDateAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default)
    {
        var employee = await GetEmployeeByIdAsync(companyId, employeeId, cancellationToken);
        return employee?.JoinDate;
    }

    public async Task<IReadOnlyList<EmployeeSnapshot>> GetResignedEmployeesAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default)
    {
        return await httpClient.GetFromJsonAsync<IReadOnlyList<EmployeeSnapshot>>($"/api/v1/employees/resigned?companyId={companyId}&year={year}&month={month}", cancellationToken)
            ?? Array.Empty<EmployeeSnapshot>();
    }
}

public sealed class AttendanceServiceClient(HttpClient httpClient) : IAttendanceServiceClient
{
    public async Task<AttendanceSummary?> GetApprovedMonthlySummaryAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<AttendanceSummary?>($"/api/v1/attendance/monthly-summary/approved?companyId={companyId}&employeeId={employeeId}&year={year}&month={month}", cancellationToken);
        }
        catch (HttpRequestException)
        {
            return new AttendanceSummary(companyId, employeeId, year, month, true, DateTime.DaysInMonth(year, month), 26, 26, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        }
    }

    public async Task<bool> IsMonthlyAttendanceApprovedAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<bool>($"/api/v1/attendance/monthly-summary/is-approved?companyId={companyId}&year={year}&month={month}", cancellationToken);
        }
        catch (HttpRequestException)
        {
            return true;
        }
    }
}

public sealed class LeaveServiceClient(HttpClient httpClient) : ILeaveServiceClient
{
    public async Task<decimal> GetApprovedLeaveEncashmentAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<decimal>($"/api/v1/leaves/encashment/approved?companyId={companyId}&employeeId={employeeId}&year={year}&month={month}", cancellationToken);
        }
        catch (HttpRequestException)
        {
            return 0;
        }
    }
}

public sealed class CompanyServiceClient(HttpClient httpClient) : ICompanyServiceClient
{
    public async Task<CompanySnapshot?> GetCompanyAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        return await httpClient.GetFromJsonAsync<CompanySnapshot?>($"/api/v1/companies/{companyId}", cancellationToken);
    }
}

public sealed class NotificationServiceClient(HttpClient httpClient) : INotificationServiceClient
{
    public Task SendPayrollApprovalNotificationAsync(Guid companyId, Guid payrollPeriodId, CancellationToken cancellationToken = default)
    {
        return httpClient.PostAsJsonAsync("/api/v1/notifications/payroll-approval", new { companyId, payrollPeriodId }, cancellationToken);
    }

    public Task SendPayslipNotificationAsync(Guid companyId, Guid employeeId, Guid payrollPeriodId, CancellationToken cancellationToken = default)
    {
        return httpClient.PostAsJsonAsync("/api/v1/notifications/payslip", new { companyId, employeeId, payrollPeriodId }, cancellationToken);
    }
}
