namespace PayrollService.Contracts;

public abstract record IntegrationEvent(string EventName, DateTime OccurredAt);

public sealed record PayrollProcessedEvent(Guid CompanyId, int Year, int Month, Guid PayrollPeriodId, Guid PayrollRunId, int ProcessedEmployees, DateTime ProcessedAt)
    : IntegrationEvent(nameof(PayrollProcessed), DateTime.UtcNow);

public sealed record PayrollProcessed;

public sealed record PayrollApprovedEvent(Guid CompanyId, int Year, int Month, Guid PayrollPeriodId, DateTime ApprovedAt)
    : IntegrationEvent("PayrollApproved", DateTime.UtcNow);

public sealed record PayrollLockedEvent(Guid CompanyId, int Year, int Month, Guid PayrollPeriodId, DateTime LockedAt)
    : IntegrationEvent("PayrollLocked", DateTime.UtcNow);

public sealed record PayrollUnlockedEvent(Guid CompanyId, int Year, int Month, Guid PayrollPeriodId, DateTime UnlockedAt, string Reason)
    : IntegrationEvent("PayrollUnlocked", DateTime.UtcNow);

public sealed record SalaryAdvanceApprovedEvent(Guid CompanyId, Guid EmployeeId, Guid SalaryAdvanceId, decimal Amount)
    : IntegrationEvent("SalaryAdvanceApproved", DateTime.UtcNow);

public sealed record SalaryIncrementApprovedEvent(Guid CompanyId, Guid EmployeeId, Guid SalaryIncrementId, DateOnly EffectiveFrom)
    : IntegrationEvent("SalaryIncrementApproved", DateTime.UtcNow);

public sealed record FinalSettlementApprovedEvent(Guid CompanyId, Guid EmployeeId, Guid FinalSettlementId, decimal NetPayable)
    : IntegrationEvent("FinalSettlementApproved", DateTime.UtcNow);
