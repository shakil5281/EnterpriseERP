namespace PayrollService.Contracts;

public sealed record PayrollPolicyDto(
    Guid Id,
    Guid CompanyId,
    string PolicyName,
    string SalaryCalculationType,
    string MonthDayCalculationType,
    int? FixedMonthDays,
    bool UseAttendanceForSalary,
    bool UseApprovedAttendanceOnly,
    bool AllowOvertime,
    string? OvertimeCalculationType,
    decimal OvertimeMultiplier,
    decimal OvertimeDivisor,
    bool AllowLateDeduction,
    string? LateDeductionType,
    bool AllowAbsentDeduction,
    bool AllowTiffinBill,
    bool AllowNightBill,
    bool AllowAttendanceBonus,
    bool AllowFestivalBonus,
    bool AllowEarnLeaveEncashment,
    bool IsActive);

public sealed record CreatePayrollPolicyRequest(
    Guid CompanyId,
    string PolicyName,
    string SalaryCalculationType,
    string MonthDayCalculationType,
    int? FixedMonthDays,
    bool UseAttendanceForSalary = true,
    bool UseApprovedAttendanceOnly = true,
    bool AllowOvertime = true,
    string? OvertimeCalculationType = "BasicSalaryBased",
    decimal OvertimeMultiplier = 2,
    decimal OvertimeDivisor = 208,
    bool AllowLateDeduction = false,
    string? LateDeductionType = null,
    bool AllowAbsentDeduction = true,
    bool AllowTiffinBill = false,
    bool AllowNightBill = false,
    bool AllowAttendanceBonus = false,
    bool AllowFestivalBonus = false,
    bool AllowEarnLeaveEncashment = false);

public sealed record UpdatePayrollPolicyRequest(
    string PolicyName,
    string SalaryCalculationType,
    string MonthDayCalculationType,
    int? FixedMonthDays,
    bool UseAttendanceForSalary,
    bool UseApprovedAttendanceOnly,
    bool AllowOvertime,
    string? OvertimeCalculationType,
    decimal OvertimeMultiplier,
    decimal OvertimeDivisor,
    bool AllowLateDeduction,
    string? LateDeductionType,
    bool AllowAbsentDeduction,
    bool AllowTiffinBill,
    bool AllowNightBill,
    bool AllowAttendanceBonus,
    bool AllowFestivalBonus,
    bool AllowEarnLeaveEncashment);

public sealed record SalaryStructureDto(Guid Id, Guid CompanyId, string StructureCode, string StructureName, Guid? GradeId, bool IsActive, IReadOnlyList<SalaryStructureComponentDto> Components);

public sealed record SalaryStructureComponentDto(
    Guid Id,
    Guid CompanyId,
    Guid SalaryStructureId,
    string ComponentCode,
    string ComponentName,
    string ComponentType,
    string CalculationType,
    decimal Amount,
    decimal Percentage,
    string? BasedOnComponentCode,
    bool IsTaxable,
    bool IsActive);

public sealed record CreateSalaryStructureRequest(Guid CompanyId, string StructureCode, string StructureName, Guid? GradeId, IReadOnlyList<CreateSalaryStructureComponentRequest> Components);

public sealed record CreateSalaryStructureComponentRequest(
    Guid CompanyId,
    string ComponentCode,
    string ComponentName,
    string ComponentType,
    string CalculationType,
    decimal Amount,
    decimal Percentage,
    string? BasedOnComponentCode,
    bool IsTaxable);

public sealed record EmployeeSalaryDto(
    Guid Id,
    Guid CompanyId,
    Guid EmployeeId,
    Guid? SalaryStructureId,
    decimal GrossSalary,
    decimal BasicSalary,
    decimal HouseRent,
    decimal MedicalAllowance,
    decimal ConveyanceAllowance,
    decimal FoodAllowance,
    DateOnly EffectiveFrom,
    DateOnly? EffectiveTo,
    bool IsCurrent);

public sealed record EmployeeSalaryRequest(
    Guid CompanyId,
    Guid EmployeeId,
    Guid? SalaryStructureId,
    decimal GrossSalary,
    decimal BasicSalary,
    decimal HouseRent,
    decimal MedicalAllowance,
    decimal ConveyanceAllowance,
    decimal FoodAllowance,
    DateOnly EffectiveFrom,
    Guid? CreatedBy);

public sealed record SalaryIncrementDto(Guid Id, Guid CompanyId, Guid EmployeeId, decimal OldGrossSalary, decimal NewGrossSalary, decimal IncrementAmount, decimal IncrementPercentage, DateOnly EffectiveFrom, string Status);

public sealed record SalaryIncrementRequest(
    Guid CompanyId,
    Guid EmployeeId,
    decimal OldGrossSalary,
    decimal NewGrossSalary,
    decimal OldBasicSalary,
    decimal NewBasicSalary,
    DateOnly EffectiveFrom,
    string Reason,
    Guid RequestedBy);

public sealed record PayrollPeriodDto(Guid Id, Guid CompanyId, int YearNo, int MonthNo, DateOnly StartDate, DateOnly EndDate, string Status, bool IsAttendanceLocked, bool IsPayrollLocked);

public sealed record CreatePayrollPeriodRequest(Guid CompanyId, int YearNo, int MonthNo, DateOnly StartDate, DateOnly EndDate);

public sealed record ProcessPayrollRequest(Guid CompanyId, int YearNo, int MonthNo, Guid? ProcessedBy, bool ForceReprocess = false);

public sealed record EmployeePayrollDto(
    Guid Id,
    Guid CompanyId,
    Guid PayrollPeriodId,
    Guid PayrollRunId,
    Guid EmployeeId,
    string SalaryCalculationType,
    decimal GrossSalary,
    decimal BasicSalary,
    decimal TotalDays,
    decimal WorkingDays,
    decimal PresentDays,
    decimal AbsentDays,
    decimal LeaveDays,
    decimal LeaveWithoutPayDays,
    decimal LateDays,
    decimal OvertimeHours,
    decimal OvertimeRate,
    decimal OvertimeAmount,
    decimal TiffinBillAmount,
    decimal NightBillAmount,
    decimal AttendanceBonusAmount,
    decimal FestivalBonusAmount,
    decimal EarnLeaveEncashmentAmount,
    decimal TotalEarnings,
    decimal TotalDeduction,
    decimal NetSalary,
    string Status,
    IReadOnlyList<PayrollEarningDto> Earnings,
    IReadOnlyList<PayrollDeductionDto> Deductions);

public sealed record PayrollEarningDto(string EarningCode, string EarningName, decimal Amount, bool IsManual, string? Remarks);

public sealed record PayrollDeductionDto(string DeductionCode, string DeductionName, decimal Amount, bool IsManual, string? Remarks);

public sealed record SalarySheetRowDto(Guid EmployeeId, decimal GrossSalary, decimal BasicSalary, decimal TotalEarnings, decimal TotalDeduction, decimal NetSalary, string Status);

public sealed record PayrollSummaryDto(Guid PayrollPeriodId, int TotalEmployees, decimal GrossSalary, decimal TotalEarnings, decimal TotalDeduction, decimal NetSalary, string Status);

public sealed record BankSheetRowDto(Guid EmployeeId, string BankAccountNo, string BankName, decimal NetSalary);

public sealed record PayslipDto(EmployeePayrollDto Payroll, PayrollSummaryDto PeriodSummary);

public sealed record SalaryAdvanceDto(Guid Id, Guid CompanyId, Guid EmployeeId, string AdvanceNo, decimal AdvanceAmount, decimal PaidAmount, decimal BalanceAmount, DateOnly AdvanceDate, decimal InstallmentAmount, string Status);

public sealed record SalaryAdvanceRequest(
    Guid CompanyId,
    Guid EmployeeId,
    string AdvanceNo,
    decimal AdvanceAmount,
    DateOnly AdvanceDate,
    int DeductionStartMonth,
    int DeductionStartYear,
    decimal InstallmentAmount,
    Guid? RequestedBy);

public sealed record SalaryAdvanceBalanceDto(Guid EmployeeId, decimal ApprovedBalance, decimal RunningBalance, decimal TotalBalance);

public sealed record AllowanceBillDto(Guid Id, Guid CompanyId, Guid EmployeeId, string AllowanceType, DateOnly BillDate, decimal Quantity, decimal Rate, decimal Amount, string Status, string? Remarks);

public sealed record AllowanceBillRequest(Guid CompanyId, Guid EmployeeId, string AllowanceType, DateOnly BillDate, decimal Quantity, decimal Rate, decimal Amount, string? Remarks);

public sealed record DeductionDto(Guid Id, Guid CompanyId, Guid EmployeeId, string DeductionType, decimal Amount, int YearNo, int MonthNo, string Status, string? Remarks);

public sealed record CreateDeductionRequest(Guid CompanyId, Guid EmployeeId, string DeductionType, decimal Amount, int YearNo, int MonthNo, string? Remarks);

public sealed record FinalSettlementDto(Guid Id, Guid CompanyId, Guid EmployeeId, DateOnly SettlementDate, DateOnly LastWorkingDate, decimal NetPayable, string Status);

public sealed record FinalSettlementRequest(
    Guid CompanyId,
    Guid EmployeeId,
    DateOnly SettlementDate,
    DateOnly LastWorkingDate,
    decimal SalaryPayable,
    decimal EarnLeaveAmount,
    decimal ServiceBenefitAmount,
    decimal GratuityAmount,
    decimal AdvanceDeduction,
    decimal OtherDeduction);

public sealed record PayrollLockCheckDto(Guid? PayrollPeriodId, bool IsLocked, string? Status);

public sealed record ApprovalRequest(Guid UserId, string? Remarks);

public sealed record LockPayrollRequest(Guid LockedBy, string? Remarks);

public sealed record UnlockPayrollRequest(Guid UnlockedBy, string UnlockReason);
