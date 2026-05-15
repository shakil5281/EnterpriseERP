using System.Net.Http.Json;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using Erp.BuildingBlocks.CommonResponses;

namespace AttendanceService.Infrastructure.Services;

public class ShiftServiceClient(HttpClient httpClient) : IShiftServiceClient
{
    public async Task<ShiftDto?> GetApplicableShiftAsync(Guid companyId, Guid employeeId, DateTime date)
    {
        try
        {
            var response = await httpClient.GetFromJsonAsync<ApiResponse<ShiftDto>>(
                $"api/Shifts/applicable?companyId={companyId}&employeeId={employeeId}&date={date:yyyy-MM-dd}");

            return response?.Data;
        }
        catch
        {
            return null;
        }
    }

    public async Task<ShiftRuleDto> GetShiftRulesAsync(Guid shiftId)
    {
        var response = await httpClient.GetFromJsonAsync<ApiResponse<ShiftRuleDto>>($"api/shift-rules/{shiftId}");
        return response?.Data ?? new ShiftRuleDto(Guid.Empty, shiftId, 10, 5, 10, 5, 480, 240, true, 30, 30, 240);
    }

    public async Task<List<ShiftBreakDto>> GetShiftBreaksAsync(Guid shiftId)
    {
        var response = await httpClient.GetFromJsonAsync<ApiResponse<List<ShiftBreakDto>>>($"api/shift-breaks/{shiftId}");
        return response?.Data ?? [];
    }
}
