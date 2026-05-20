using System.Net.Http.Json;
using System.Text.Json.Serialization;
using PayrollService.Application;

namespace PayrollService.Infrastructure.ExternalServices;

public sealed class EmployeeServiceClient(HttpClient httpClient) : IEmployeeServiceClient
{
    public async Task<IReadOnlyList<EmployeeSnapshot>> GetActiveEmployeesAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.GetFromJsonAsync<HrApiResponse<HrPagedResult<HrEmployeeListItem>>>(
                $"/api/v1/hr/Employees?companyId={companyId}&status=Active&page=1&pageSize=5000",
                cancellationToken);

            return response?.Data?.Items?.Select(MapEmployee).ToList() ?? [];
        }
        catch (HttpRequestException)
        {
            return [];
        }
    }

    public async Task<EmployeeSnapshot?> GetEmployeeByIdAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.GetFromJsonAsync<HrApiResponse<HrEmployeeDetails>>(
                $"/api/v1/hr/Employees/{employeeId}",
                cancellationToken);

            return response?.Data is null ? null : MapEmployee(response.Data, companyId);
        }
        catch (HttpRequestException)
        {
            return null;
        }
    }

    public async Task<DateOnly?> GetEmployeeJoinDateAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default)
    {
        var employee = await GetEmployeeByIdAsync(companyId, employeeId, cancellationToken);
        return employee?.JoinDate;
    }

    public async Task<IReadOnlyList<EmployeeSnapshot>> GetResignedEmployeesAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.GetFromJsonAsync<HrApiResponse<HrPagedResult<HrEmployeeListItem>>>(
                $"/api/v1/hr/Employees?companyId={companyId}&status=Resigned&page=1&pageSize=5000",
                cancellationToken);

            return response?.Data?.Items?.Select(MapEmployee).ToList() ?? [];
        }
        catch (HttpRequestException)
        {
            return [];
        }
    }

    private static EmployeeSnapshot MapEmployee(HrEmployeeListItem item) => new(
        item.Id,
        item.CompanyId,
        item.JoinDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
        string.Equals(item.Status, "Active", StringComparison.OrdinalIgnoreCase),
        item.BankAccountNo,
        item.BankName,
        item.EmployeeID,
        item.FullName,
        item.DepartmentId,
        item.DepartmentName,
        item.SectionId,
        item.SectionName,
        item.DesignationId,
        item.DesignationName,
        item.LineId,
        item.LineName);

    private static EmployeeSnapshot MapEmployee(HrEmployeeDetails item, Guid companyId) => new(
        item.Id,
        companyId,
        item.JoinDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
        string.Equals(item.Status, "Active", StringComparison.OrdinalIgnoreCase),
        item.BankAccountNo,
        item.BankName,
        item.EmployeeID,
        item.FullName,
        item.DepartmentId,
        item.DepartmentName,
        item.SectionId,
        item.SectionName,
        item.DesignationId,
        item.DesignationName,
        item.LineId,
        item.LineName);

    private sealed class HrApiResponse<T>
    {
        [JsonPropertyName("data")]
        public T? Data { get; init; }
    }

    private sealed class HrPagedResult<T>
    {
        [JsonPropertyName("items")]
        public List<T>? Items { get; init; }
    }

    private sealed class HrEmployeeListItem
    {
        [JsonPropertyName("id")]
        public Guid Id { get; init; }

        [JsonPropertyName("companyId")]
        public Guid CompanyId { get; init; }

        [JsonPropertyName("employeeID")]
        public string EmployeeID { get; init; } = string.Empty;

        [JsonPropertyName("fullName")]
        public string FullName { get; init; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; init; } = string.Empty;

        [JsonPropertyName("designationName")]
        public string? DesignationName { get; init; }

        [JsonPropertyName("departmentName")]
        public string? DepartmentName { get; init; }

        [JsonPropertyName("joinDate")]
        public DateOnly? JoinDate { get; init; }

        [JsonPropertyName("departmentId")]
        public int? DepartmentId { get; init; }

        [JsonPropertyName("sectionId")]
        public int? SectionId { get; init; }

        [JsonPropertyName("sectionName")]
        public string? SectionName { get; init; }

        [JsonPropertyName("designationId")]
        public int? DesignationId { get; init; }

        [JsonPropertyName("lineId")]
        public int? LineId { get; init; }

        [JsonPropertyName("lineName")]
        public string? LineName { get; init; }

        [JsonPropertyName("bankAccountNo")]
        public string? BankAccountNo { get; init; }

        [JsonPropertyName("bankName")]
        public string? BankName { get; init; }
    }

    private sealed class HrEmployeeDetails
    {
        [JsonPropertyName("id")]
        public Guid Id { get; init; }

        [JsonPropertyName("employeeID")]
        public string EmployeeID { get; init; } = string.Empty;

        [JsonPropertyName("fullName")]
        public string FullName { get; init; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; init; } = string.Empty;

        [JsonPropertyName("joinDate")]
        public DateOnly? JoinDate { get; init; }

        [JsonPropertyName("departmentId")]
        public int? DepartmentId { get; init; }

        [JsonPropertyName("departmentName")]
        public string? DepartmentName { get; init; }

        [JsonPropertyName("sectionId")]
        public int? SectionId { get; init; }

        [JsonPropertyName("sectionName")]
        public string? SectionName { get; init; }

        [JsonPropertyName("designationId")]
        public int? DesignationId { get; init; }

        [JsonPropertyName("designationName")]
        public string? DesignationName { get; init; }

        [JsonPropertyName("lineId")]
        public int? LineId { get; init; }

        [JsonPropertyName("lineName")]
        public string? LineName { get; init; }

        [JsonPropertyName("bankAccountNo")]
        public string? BankAccountNo { get; init; }

        [JsonPropertyName("bankName")]
        public string? BankName { get; init; }
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
    public Task SendPayrollApprovalNotificationAsync(Guid companyId, Guid payrollPeriodId, CancellationToken cancellationToken = default) => Task.CompletedTask;

    public Task SendPayslipNotificationAsync(Guid companyId, Guid employeeId, Guid payrollPeriodId, CancellationToken cancellationToken = default) => Task.CompletedTask;
}
