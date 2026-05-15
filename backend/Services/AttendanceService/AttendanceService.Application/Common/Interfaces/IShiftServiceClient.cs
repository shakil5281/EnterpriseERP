using AttendanceService.Application.DTOs;

namespace AttendanceService.Application.Common.Interfaces;

public interface IShiftServiceClient
{
    Task<ShiftDto?> GetApplicableShiftAsync(Guid companyId, Guid employeeId, DateTime date);
    Task<ShiftRuleDto> GetShiftRulesAsync(Guid shiftId);
    Task<List<ShiftBreakDto>> GetShiftBreaksAsync(Guid shiftId);
}

public interface IPayrollServiceClient
{
    Task<bool> IsPayrollLockedAsync(Guid companyId, int year, int month);
}

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null);
    Task RemoveAsync(string key);
}

public interface IEventBus
{
    Task PublishAsync<T>(T @event) where T : class;
}
