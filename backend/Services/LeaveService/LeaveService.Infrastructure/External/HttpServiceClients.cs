using System.Net.Http.Json;
using System.Text.Json;
using LeaveService.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace LeaveService.Infrastructure.External;

public sealed class EmployeeServiceClientOptions
{
    public string BaseUrl { get; set; } = "http://127.0.0.1:5035/";
}

public sealed class EmployeeServiceClient(HttpClient http, IOptions<EmployeeServiceClientOptions> options) : IEmployeeServiceClient
{
    private readonly string _base = options.Value.BaseUrl.TrimEnd('/');

    public async Task<bool> IsEmployeeActiveAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default)
    {
        var doc = await GetEmployeeJsonAsync(employeeId, cancellationToken);
        if (doc == null)
        {
            return false;
        }

        if (!doc.RootElement.TryGetProperty("data", out var data))
        {
            return false;
        }

        if (!TryGetGuid(data, "companyId", out var cid) || cid != companyId)
        {
            return false;
        }

        return TryGetString(data, "status", out var st) &&
               string.Equals(st, "Active", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<DateOnly?> GetEmployeeJoinDateAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default)
    {
        var doc = await GetEmployeeJsonAsync(employeeId, cancellationToken);
        if (doc == null || !doc.RootElement.TryGetProperty("data", out var data))
        {
            return null;
        }

        if (!TryGetGuid(data, "companyId", out var cid) || cid != companyId)
        {
            return null;
        }

        if (data.TryGetProperty("joinDate", out var jd) && jd.ValueKind == JsonValueKind.String &&
            DateTime.TryParse(jd.GetString(), out var dt))
        {
            return DateOnly.FromDateTime(dt);
        }

        return null;
    }

    public async Task<IReadOnlyList<Guid>> GetActiveEmployeeIdsAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            var url =
                $"{_base}/api/v1/hr/Employees?companyId={companyId}&status=Active&page=1&pageSize=5000";
            var resp = await http.GetAsync(url, cancellationToken);
            if (!resp.IsSuccessStatusCode)
            {
                return Array.Empty<Guid>();
            }

            var wrapper = await resp.Content.ReadFromJsonAsync<HrPageWrapper>(cancellationToken: cancellationToken);
            return wrapper?.Data?.Items?.Select(x => x.Id).ToArray() ?? Array.Empty<Guid>();
        }
        catch
        {
            return Array.Empty<Guid>();
        }
    }

    private async Task<JsonDocument?> GetEmployeeJsonAsync(Guid employeeId, CancellationToken cancellationToken)
    {
        try
        {
            var url = $"{_base}/api/v1/hr/Employees/{employeeId}";
            var resp = await http.GetAsync(url, cancellationToken);
            if (!resp.IsSuccessStatusCode)
            {
                return null;
            }

            return await JsonDocument.ParseAsync(await resp.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
        }
        catch
        {
            return null;
        }
    }

    private static bool TryGetGuid(JsonElement el, string name, out Guid value)
    {
        value = default;
        if (!el.TryGetProperty(name, out var p))
        {
            return false;
        }

        return Guid.TryParse(p.GetString(), out value);
    }

    private static bool TryGetString(JsonElement el, string name, out string value)
    {
        value = string.Empty;
        if (!el.TryGetProperty(name, out var p) || p.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        value = p.GetString() ?? string.Empty;
        return true;
    }

    private sealed class HrPageWrapper
    {
        public HrPageData? Data { get; set; }
    }

    private sealed class HrPageData
    {
        public List<HrEmp>? Items { get; set; }
    }

    private sealed class HrEmp
    {
        public Guid Id { get; set; }
    }
}

public sealed class AttendanceServiceClientOptions
{
    public string BaseUrl { get; set; } = "http://127.0.0.1:5037/";
}

public sealed class AttendanceServiceClient(HttpClient http, IOptions<AttendanceServiceClientOptions> options) : IAttendanceServiceClient
{
    private readonly string _base = options.Value.BaseUrl.TrimEnd('/');

    public async Task<decimal> GetMonthlyApprovedWorkingDaysAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default)
    {
        var from = new DateTime(year, month, 1);
        var to = new DateTime(year, month, DateTime.DaysInMonth(year, month));
        return await GetWorkingDaysInRangeAsync(companyId, employeeId, DateOnly.FromDateTime(from), DateOnly.FromDateTime(to), cancellationToken);
    }

    public async Task<decimal> GetWorkingDaysInRangeAsync(Guid companyId, Guid employeeId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        try
        {
            var url =
                $"{_base}/api/Attendance/summary?companyId={companyId}&fromDate={from:yyyy-MM-dd}&toDate={to:yyyy-MM-dd}&employeeId={employeeId}";
            var resp = await http.GetAsync(url, cancellationToken);
            if (!resp.IsSuccessStatusCode)
            {
                return CountWeekdays(from, to);
            }

            var doc = await JsonDocument.ParseAsync(await resp.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
            if (!doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
            {
                return CountWeekdays(from, to);
            }

            decimal sum = 0;
            foreach (var row in data.EnumerateArray())
            {
                if (row.TryGetProperty("totalPresent", out var tp) && tp.TryGetInt32(out var v))
                {
                    sum += v;
                }
            }

            return sum > 0 ? sum : CountWeekdays(from, to);
        }
        catch
        {
            return CountWeekdays(from, to);
        }
    }

    private static decimal CountWeekdays(DateOnly from, DateOnly to)
    {
        decimal d = 0;
        for (var x = from; x <= to; x = x.AddDays(1))
        {
            var dow = x.ToDateTime(TimeOnly.MinValue).DayOfWeek;
            if (dow is not DayOfWeek.Saturday and not DayOfWeek.Sunday)
            {
                d++;
            }
        }

        return d;
    }
}

public sealed class PayrollServiceClientOptions
{
    public string BaseUrl { get; set; } = "http://127.0.0.1:5039/";
}

public sealed class PayrollServiceClient : IPayrollServiceClient
{
    public Task<bool> IsPayrollLockedAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default) =>
        Task.FromResult(false);
}

public sealed class NotificationServiceClient : INotificationServiceClient
{
    public Task SendLeaveApprovalNotificationAsync(Guid approverUserId, Guid leaveApplicationId, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task SendLeaveStatusNotificationAsync(Guid employeeId, Guid leaveApplicationId, string status, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
