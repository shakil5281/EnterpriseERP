namespace LeaveService.Application.Common.Interfaces;

public interface IEmployeeServiceClient
{
    Task<bool> IsEmployeeActiveAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default);
    Task<DateOnly?> GetEmployeeJoinDateAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Guid>> GetActiveEmployeeIdsAsync(Guid companyId, CancellationToken cancellationToken = default);
}

public interface IAttendanceServiceClient
{
    Task<decimal> GetMonthlyApprovedWorkingDaysAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default);
    Task<decimal> GetWorkingDaysInRangeAsync(Guid companyId, Guid employeeId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);
}

public interface IPayrollServiceClient
{
    Task<bool> IsPayrollLockedAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default);
}

public interface INotificationServiceClient
{
    Task SendLeaveApprovalNotificationAsync(Guid approverUserId, Guid leaveApplicationId, CancellationToken cancellationToken = default);
    Task SendLeaveStatusNotificationAsync(Guid employeeId, Guid leaveApplicationId, string status, CancellationToken cancellationToken = default);
}

public interface ILeaveCache
{
    Task<T?> GetOrCreateAsync<T>(string key, TimeSpan ttl, Func<CancellationToken, Task<T>> factory, CancellationToken cancellationToken = default) where T : class;
    Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default);
}
