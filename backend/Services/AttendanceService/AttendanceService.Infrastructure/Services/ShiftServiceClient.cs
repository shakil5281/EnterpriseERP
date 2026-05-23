using System.Net.Http.Json;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;

namespace AttendanceService.Infrastructure.Services;

public class ShiftServiceClient(HttpClient httpClient) : IShiftServiceClient
{
    public async Task<ShiftEvaluationDto?> GetShiftEvaluationAsync(
        Guid companyId,
        Guid employeeId,
        DateTime date,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var url = $"shifts/evaluation?companyId={companyId}&employeeId={employeeId}&date={date:yyyy-MM-dd}";
            var response = await httpClient.GetFromJsonAsync<ShiftApiEnvelope<ShiftEvaluationDto>>(url, cancellationToken);
            return response?.Success == true ? response.Data : null;
        }
        catch
        {
            return null;
        }
    }

    private sealed class ShiftApiEnvelope<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
    }
}
