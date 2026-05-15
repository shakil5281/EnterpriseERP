using MediatR;
using PayrollService.Contracts;

namespace PayrollService.Application;

public sealed record CreatePayrollPolicyCommand(CreatePayrollPolicyRequest Request) : IRequest<ApiResponse<PayrollPolicyDto>>;
public sealed record UpdatePayrollPolicyCommand(Guid Id, UpdatePayrollPolicyRequest Request) : IRequest<ApiResponse<PayrollPolicyDto>>;
public sealed record SetPayrollPolicyActiveCommand(Guid Id, bool IsActive) : IRequest<ApiResponse<PayrollPolicyDto>>;

public sealed record CreateSalaryStructureCommand(CreateSalaryStructureRequest Request) : IRequest<ApiResponse<SalaryStructureDto>>;
public sealed record AddSalaryStructureComponentCommand(Guid SalaryStructureId, CreateSalaryStructureComponentRequest Request) : IRequest<ApiResponse<SalaryStructureComponentDto>>;

public sealed record AssignEmployeeSalaryCommand(EmployeeSalaryRequest Request) : IRequest<ApiResponse<EmployeeSalaryDto>>;
public sealed record CreateSalaryIncrementCommand(SalaryIncrementRequest Request) : IRequest<ApiResponse<SalaryIncrementDto>>;
public sealed record ApproveSalaryIncrementCommand(Guid Id, Guid ApprovedBy) : IRequest<ApiResponse<SalaryIncrementDto>>;
public sealed record RejectSalaryIncrementCommand(Guid Id, Guid RejectedBy, string? Remarks) : IRequest<ApiResponse<SalaryIncrementDto>>;

public sealed record CreatePayrollPeriodCommand(CreatePayrollPeriodRequest Request) : IRequest<ApiResponse<PayrollPeriodDto>>;
public sealed record ProcessPayrollCommand(ProcessPayrollRequest Request) : IRequest<ApiResponse<PayrollSummaryDto>>;
public sealed record ReprocessPayrollCommand(ProcessPayrollRequest Request) : IRequest<ApiResponse<PayrollSummaryDto>>;
public sealed record SubmitPayrollCommand(Guid PayrollPeriodId, Guid SubmittedBy) : IRequest<ApiResponse<PayrollPeriodDto>>;
public sealed record ApprovePayrollCommand(Guid PayrollPeriodId, Guid ApprovedBy, string? Remarks) : IRequest<ApiResponse<PayrollPeriodDto>>;
public sealed record RejectPayrollCommand(Guid PayrollPeriodId, Guid RejectedBy, string? Remarks) : IRequest<ApiResponse<PayrollPeriodDto>>;
public sealed record LockPayrollCommand(Guid PayrollPeriodId, Guid LockedBy, string? Remarks) : IRequest<ApiResponse<PayrollPeriodDto>>;
public sealed record UnlockPayrollCommand(Guid PayrollPeriodId, Guid UnlockedBy, string UnlockReason) : IRequest<ApiResponse<PayrollPeriodDto>>;

public sealed record CreateSalaryAdvanceCommand(SalaryAdvanceRequest Request) : IRequest<ApiResponse<SalaryAdvanceDto>>;
public sealed record ApproveSalaryAdvanceCommand(Guid Id, Guid ApprovedBy) : IRequest<ApiResponse<SalaryAdvanceDto>>;
public sealed record RejectSalaryAdvanceCommand(Guid Id, Guid RejectedBy, string? Remarks) : IRequest<ApiResponse<SalaryAdvanceDto>>;

public sealed record CreateAllowanceBillCommand(AllowanceBillRequest Request) : IRequest<ApiResponse<AllowanceBillDto>>;
public sealed record ApproveAllowanceBillCommand(Guid Id, Guid ApprovedBy) : IRequest<ApiResponse<AllowanceBillDto>>;
public sealed record RejectAllowanceBillCommand(Guid Id, Guid RejectedBy, string? Remarks) : IRequest<ApiResponse<AllowanceBillDto>>;

public sealed record CreateDeductionCommand(CreateDeductionRequest Request) : IRequest<ApiResponse<DeductionDto>>;
public sealed record GeneratePayslipCommand(Guid PayrollPeriodId, Guid EmployeeId) : IRequest<ApiResponse<PayslipDto>>;
public sealed record GenerateFinalSettlementCommand(FinalSettlementRequest Request) : IRequest<ApiResponse<FinalSettlementDto>>;
public sealed record ApproveFinalSettlementCommand(Guid Id, Guid ApprovedBy) : IRequest<ApiResponse<FinalSettlementDto>>;

public sealed record GetPayrollPolicyQuery(Guid? Id, Guid? CompanyId) : IRequest<ApiResponse<IReadOnlyList<PayrollPolicyDto>>>;
public sealed record GetPayrollPeriodQuery(Guid? Id, Guid? CompanyId) : IRequest<ApiResponse<IReadOnlyList<PayrollPeriodDto>>>;
public sealed record GetEmployeePayrollQuery(Guid PayrollPeriodId, Guid? EmployeeId) : IRequest<ApiResponse<IReadOnlyList<EmployeePayrollDto>>>;
public sealed record GetSalarySheetQuery(Guid PayrollPeriodId) : IRequest<ApiResponse<IReadOnlyList<SalarySheetRowDto>>>;
public sealed record GetPayslipQuery(Guid PayrollPeriodId, Guid EmployeeId) : IRequest<ApiResponse<PayslipDto>>;
public sealed record GetBankSheetQuery(Guid PayrollPeriodId) : IRequest<ApiResponse<IReadOnlyList<BankSheetRowDto>>>;
public sealed record GetPayrollSummaryQuery(Guid PayrollPeriodId) : IRequest<ApiResponse<PayrollSummaryDto>>;
public sealed record GetSalaryAdvanceBalanceQuery(Guid CompanyId, Guid EmployeeId) : IRequest<ApiResponse<SalaryAdvanceBalanceDto>>;
public sealed record GetSalaryIncrementHistoryQuery(Guid CompanyId, Guid? EmployeeId) : IRequest<ApiResponse<IReadOnlyList<SalaryIncrementDto>>>;
public sealed record GetAllowanceBillsQuery(Guid CompanyId, Guid? EmployeeId, DateOnly? FromDate, DateOnly? ToDate) : IRequest<ApiResponse<IReadOnlyList<AllowanceBillDto>>>;
public sealed record GetDeductionHistoryQuery(Guid CompanyId, Guid? EmployeeId) : IRequest<ApiResponse<IReadOnlyList<DeductionDto>>>;
public sealed record GetFinalSettlementQuery(Guid CompanyId, Guid? EmployeeId) : IRequest<ApiResponse<IReadOnlyList<FinalSettlementDto>>>;
public sealed record GetSalaryStructuresQuery(Guid CompanyId) : IRequest<ApiResponse<IReadOnlyList<SalaryStructureDto>>>;
public sealed record GetSalaryStructureComponentsQuery(Guid SalaryStructureId) : IRequest<ApiResponse<IReadOnlyList<SalaryStructureComponentDto>>>;
public sealed record GetCurrentEmployeeSalaryQuery(Guid CompanyId, Guid EmployeeId) : IRequest<ApiResponse<EmployeeSalaryDto>>;
public sealed record GetEmployeeSalaryHistoryQuery(Guid CompanyId, Guid EmployeeId) : IRequest<ApiResponse<IReadOnlyList<EmployeeSalaryDto>>>;
public sealed record CheckPayrollLockQuery(Guid CompanyId, int YearNo, int MonthNo) : IRequest<ApiResponse<PayrollLockCheckDto>>;
