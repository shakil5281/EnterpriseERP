using LeaveService.Domain.Entities;

namespace LeaveService.Application.Common.Interfaces;

public interface ILeaveUnitOfWork
{
    ILeaveTypeRepository LeaveTypes { get; }
    ILeavePolicyRepository LeavePolicies { get; }
    IEmployeeLeaveBalanceRepository EmployeeLeaveBalances { get; }
    ILeaveApplicationRepository LeaveApplications { get; }
    ILeaveApprovalStepRepository LeaveApprovalSteps { get; }
    ILeaveTransactionRepository LeaveTransactions { get; }
    IHolidayRepository Holidays { get; }
    IWeeklyOffRuleRepository WeeklyOffRules { get; }
    IEarnLeavePolicyRepository EarnLeavePolicies { get; }
    ILeaveEncashmentRepository LeaveEncashments { get; }
    IPayrollMonthLockRepository PayrollMonthLocks { get; }
    ILeaveAuditLogRepository AuditLogs { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface ILeaveTypeRepository
{
    Task<LeaveType?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<LeaveType?> GetByCompanyAndCodeAsync(Guid companyId, string leaveCode, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LeaveType>> ListByCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
    void Add(LeaveType entity);
}

public interface ILeavePolicyRepository
{
    Task<LeavePolicy?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<LeavePolicy?> GetActiveByCompanyAndLeaveTypeAsync(Guid companyId, Guid leaveTypeId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LeavePolicy>> ListByCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
    void Add(LeavePolicy entity);
}

public interface IEmployeeLeaveBalanceRepository
{
    Task<EmployeeLeaveBalance?> GetAsync(Guid companyId, Guid employeeId, Guid leaveTypeId, int yearNo, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EmployeeLeaveBalance>> ListByEmployeeYearAsync(Guid companyId, Guid employeeId, int yearNo, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EmployeeLeaveBalance>> ListByCompanyYearAsync(Guid companyId, int yearNo, CancellationToken cancellationToken = default);
    void Add(EmployeeLeaveBalance entity);
}

public interface ILeaveApplicationRepository
{
    Task<LeaveApplication?> GetWithStepsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LeaveApplication>> ListByCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<bool> HasOverlappingPendingOrApprovedAsync(Guid companyId, Guid employeeId, DateOnly from, DateOnly to, Guid? excludeApplicationId, CancellationToken cancellationToken = default);
    Task<LeaveApplication?> GetApprovedLeaveForDayAsync(Guid companyId, Guid employeeId, DateOnly date, CancellationToken cancellationToken = default);
    void Add(LeaveApplication entity);
}

public interface ILeaveApprovalStepRepository
{
    void AddRange(IEnumerable<LeaveApprovalStep> steps);
}

public interface ILeaveTransactionRepository
{
    void Add(LeaveTransaction entity);
}

public interface IHolidayRepository
{
    Task<Holiday?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Holiday?> GetByCompanyAndDateAsync(Guid companyId, DateOnly date, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Holiday>> ListByCompanyYearAsync(Guid companyId, int year, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Holiday>> ListActiveBetweenAsync(Guid companyId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);
    void Add(Holiday entity);
    void Remove(Holiday entity);
}

public interface IWeeklyOffRuleRepository
{
    Task<IReadOnlyList<WeeklyOffRule>> ListByCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<WeeklyOffRule?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    void Add(WeeklyOffRule entity);
    void Remove(WeeklyOffRule entity);
}

public interface IEarnLeavePolicyRepository
{
    Task<EarnLeavePolicy?> GetActiveByCompanyAndLeaveTypeAsync(Guid companyId, Guid leaveTypeId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EarnLeavePolicy>> ListActiveByCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
    void Add(EarnLeavePolicy entity);
}

public interface ILeaveEncashmentRepository
{
    Task<LeaveEncashment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LeaveEncashment>> ListByCompanyYearAsync(Guid companyId, int? year, CancellationToken cancellationToken = default);
    void Add(LeaveEncashment entity);
}

public interface IPayrollMonthLockRepository
{
    Task<PayrollMonthLock?> GetAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default);
    Task UpsertAsync(PayrollMonthLock entity, CancellationToken cancellationToken = default);
}

public interface ILeaveAuditLogRepository
{
    Task<IReadOnlyList<LeaveAuditLog>> ListRecentAsync(Guid? companyId, int take, CancellationToken cancellationToken = default);
    void Add(LeaveAuditLog log);
}
