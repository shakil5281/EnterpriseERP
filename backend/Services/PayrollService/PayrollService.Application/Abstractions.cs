using PayrollService.Contracts;
using PayrollService.Domain.Entities;

namespace PayrollService.Application;

public interface IPayrollDbContext
{
    IQueryable<PayrollPolicy> PayrollPolicies { get; }
    IQueryable<SalaryStructure> SalaryStructures { get; }
    IQueryable<SalaryStructureComponent> SalaryStructureComponents { get; }
    IQueryable<EmployeeSalary> EmployeeSalaries { get; }
    IQueryable<SalaryIncrementRequestEntity> SalaryIncrementRequests { get; }
    IQueryable<PayrollPeriod> PayrollPeriods { get; }
    IQueryable<PayrollRun> PayrollRuns { get; }
    IQueryable<EmployeePayroll> EmployeePayrolls { get; }
    IQueryable<PayrollEarning> PayrollEarnings { get; }
    IQueryable<PayrollDeduction> PayrollDeductions { get; }
    IQueryable<SalaryAdvance> SalaryAdvances { get; }
    IQueryable<SalaryAdvanceInstallment> SalaryAdvanceInstallments { get; }
    IQueryable<AllowanceBill> AllowanceBills { get; }
    IQueryable<PayrollApproval> PayrollApprovals { get; }
    IQueryable<PayrollLock> PayrollLocks { get; }
    IQueryable<FinalSettlement> FinalSettlements { get; }
    IQueryable<PayrollDeductionEntry> PayrollDeductionEntries { get; }
    IQueryable<PayrollAuditLog> PayrollAuditLogs { get; }

    void Add<TEntity>(TEntity entity) where TEntity : class;
    void Remove<TEntity>(TEntity entity) where TEntity : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IRedisCacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan expiration, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
}

public interface IIntegrationEventPublisher
{
    Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default) where TEvent : IntegrationEvent;
}

public interface IEmployeeServiceClient
{
    Task<IReadOnlyList<EmployeeSnapshot>> GetActiveEmployeesAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<EmployeeSnapshot?> GetEmployeeByIdAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default);
    Task<DateOnly?> GetEmployeeJoinDateAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EmployeeSnapshot>> GetResignedEmployeesAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default);
}

public interface IAttendanceServiceClient
{
    Task<AttendanceSummary?> GetApprovedMonthlySummaryAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default);
    Task<bool> IsMonthlyAttendanceApprovedAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default);
}

public interface ILeaveServiceClient
{
    Task<decimal> GetApprovedLeaveEncashmentAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default);
}

public interface ICompanyServiceClient
{
    Task<CompanySnapshot?> GetCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
}

public interface INotificationServiceClient
{
    Task SendPayrollApprovalNotificationAsync(Guid companyId, Guid payrollPeriodId, CancellationToken cancellationToken = default);
    Task SendPayslipNotificationAsync(Guid companyId, Guid employeeId, Guid payrollPeriodId, CancellationToken cancellationToken = default);
}

public sealed record EmployeeSnapshot(Guid EmployeeId, Guid CompanyId, DateOnly JoinDate, bool IsActive, string? BankAccountNo = null, string? BankName = null);

public sealed record AttendanceSummary(
    Guid CompanyId,
    Guid EmployeeId,
    int YearNo,
    int MonthNo,
    bool IsApproved,
    decimal TotalDays,
    decimal WorkingDays,
    decimal PresentDays,
    decimal AbsentDays,
    decimal LeaveDays,
    decimal LeaveWithoutPayDays,
    decimal LateDays,
    decimal HolidayPresentDays,
    decimal WeeklyOffPresentDays,
    int OvertimeMinutes,
    decimal ApprovedTiffinDays,
    decimal ApprovedNightDutyDays,
    decimal MissingPunchDays);

public sealed record CompanySnapshot(Guid CompanyId, string CompanyCode, string CompanyName);

public interface IOvertimeCalculationService
{
    (decimal RatePerHour, decimal Amount) Calculate(PayrollPolicy policy, EmployeeSalary salary, decimal overtimeHours, decimal fixedRate = 0);
}

public interface IBonusCalculationService
{
    decimal CalculateAttendanceBonus(PayrollPolicy policy, AttendanceSummary attendance, decimal configuredAmount, decimal allowedLateLimit);
    decimal CalculateFestivalBonus(decimal grossSalary, DateOnly joinDate, DateOnly bonusDate);
}

public interface IPayrollCalculationService
{
    PayrollCalculationResult Calculate(PayrollPolicy policy, EmployeeSalary salary, AttendanceSummary attendance, PayrollCalculationInputs inputs);
}

public interface ISalaryAdvanceService
{
    Task<decimal> GetDeductibleInstallmentAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default);
    Task MarkInstallmentDeductedAsync(Guid companyId, Guid employeeId, int year, int month, Guid employeePayrollId, CancellationToken cancellationToken = default);
}

public interface ISalaryIncrementService
{
    Task ApproveAsync(Guid id, Guid approvedBy, CancellationToken cancellationToken = default);
}

public interface IFinalSettlementService
{
    decimal CalculateNetPayable(FinalSettlement settlement);
}

public sealed record PayrollCalculationInputs(decimal AttendanceBonusAmount = 500, decimal AllowedLateLimit = 0, decimal TiffinRate = 50, decimal NightBillRate = 100, decimal EarnLeaveEncashmentAmount = 0, decimal AdvanceDeduction = 0, decimal LoanDeduction = 0, decimal TaxDeduction = 0, decimal ProvidentFundDeduction = 0, decimal OtherDeduction = 0);

public sealed record PayrollCalculationResult(
    decimal TotalDays,
    decimal PerDaySalary,
    decimal PayableSalary,
    decimal AbsentDeduction,
    decimal LateDeduction,
    decimal OvertimeHours,
    decimal OvertimeRate,
    decimal OvertimeAmount,
    decimal TiffinBillAmount,
    decimal NightBillAmount,
    decimal AttendanceBonusAmount,
    decimal EarnLeaveEncashmentAmount,
    decimal TotalEarnings,
    decimal TotalDeduction,
    decimal NetSalary);
