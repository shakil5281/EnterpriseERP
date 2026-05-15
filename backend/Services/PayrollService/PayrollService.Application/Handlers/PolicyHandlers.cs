using MediatR;
using PayrollService.Contracts;
using PayrollService.Domain.Entities;

namespace PayrollService.Application.Handlers;

public sealed class PolicyHandlers(IPayrollDbContext db, IRedisCacheService cache) :
    IRequestHandler<CreatePayrollPolicyCommand, ApiResponse<PayrollPolicyDto>>,
    IRequestHandler<UpdatePayrollPolicyCommand, ApiResponse<PayrollPolicyDto>>,
    IRequestHandler<SetPayrollPolicyActiveCommand, ApiResponse<PayrollPolicyDto>>,
    IRequestHandler<GetPayrollPolicyQuery, ApiResponse<IReadOnlyList<PayrollPolicyDto>>>
{
    public async Task<ApiResponse<PayrollPolicyDto>> Handle(CreatePayrollPolicyCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        if (db.PayrollPolicies.Any(x => x.CompanyId == r.CompanyId && x.PolicyName == r.PolicyName))
        {
            return ApiResponse<PayrollPolicyDto>.Fail("Payroll policy already exists for this company.");
        }

        var policy = new PayrollPolicy
        {
            CompanyId = r.CompanyId,
            PolicyName = r.PolicyName,
            SalaryCalculationType = r.SalaryCalculationType,
            MonthDayCalculationType = r.MonthDayCalculationType,
            FixedMonthDays = r.FixedMonthDays,
            UseAttendanceForSalary = r.UseAttendanceForSalary,
            UseApprovedAttendanceOnly = r.UseApprovedAttendanceOnly,
            AllowOvertime = r.AllowOvertime,
            OvertimeCalculationType = r.OvertimeCalculationType,
            OvertimeMultiplier = r.OvertimeMultiplier,
            OvertimeDivisor = r.OvertimeDivisor,
            AllowLateDeduction = r.AllowLateDeduction,
            LateDeductionType = r.LateDeductionType,
            AllowAbsentDeduction = r.AllowAbsentDeduction,
            AllowTiffinBill = r.AllowTiffinBill,
            AllowNightBill = r.AllowNightBill,
            AllowAttendanceBonus = r.AllowAttendanceBonus,
            AllowFestivalBonus = r.AllowFestivalBonus,
            AllowEarnLeaveEncashment = r.AllowEarnLeaveEncashment,
        };

        db.Add(policy);
        await db.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.PayrollPolicy(r.CompanyId), cancellationToken);
        return ApiResponse<PayrollPolicyDto>.Ok(policy.ToDto(), "Payroll policy created.");
    }

    public async Task<ApiResponse<PayrollPolicyDto>> Handle(UpdatePayrollPolicyCommand command, CancellationToken cancellationToken)
    {
        var policy = db.PayrollPolicies.FirstOrDefault(x => x.Id == command.Id);
        if (policy is null)
        {
            return ApiResponse<PayrollPolicyDto>.Fail("Payroll policy not found.");
        }

        var r = command.Request;
        policy.PolicyName = r.PolicyName;
        policy.SalaryCalculationType = r.SalaryCalculationType;
        policy.MonthDayCalculationType = r.MonthDayCalculationType;
        policy.FixedMonthDays = r.FixedMonthDays;
        policy.UseAttendanceForSalary = r.UseAttendanceForSalary;
        policy.UseApprovedAttendanceOnly = r.UseApprovedAttendanceOnly;
        policy.AllowOvertime = r.AllowOvertime;
        policy.OvertimeCalculationType = r.OvertimeCalculationType;
        policy.OvertimeMultiplier = r.OvertimeMultiplier;
        policy.OvertimeDivisor = r.OvertimeDivisor;
        policy.AllowLateDeduction = r.AllowLateDeduction;
        policy.LateDeductionType = r.LateDeductionType;
        policy.AllowAbsentDeduction = r.AllowAbsentDeduction;
        policy.AllowTiffinBill = r.AllowTiffinBill;
        policy.AllowNightBill = r.AllowNightBill;
        policy.AllowAttendanceBonus = r.AllowAttendanceBonus;
        policy.AllowFestivalBonus = r.AllowFestivalBonus;
        policy.AllowEarnLeaveEncashment = r.AllowEarnLeaveEncashment;
        policy.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.PayrollPolicy(policy.CompanyId), cancellationToken);
        return ApiResponse<PayrollPolicyDto>.Ok(policy.ToDto(), "Payroll policy updated.");
    }

    public async Task<ApiResponse<PayrollPolicyDto>> Handle(SetPayrollPolicyActiveCommand command, CancellationToken cancellationToken)
    {
        var policy = db.PayrollPolicies.FirstOrDefault(x => x.Id == command.Id);
        if (policy is null)
        {
            return ApiResponse<PayrollPolicyDto>.Fail("Payroll policy not found.");
        }

        policy.IsActive = command.IsActive;
        policy.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.PayrollPolicy(policy.CompanyId), cancellationToken);
        return ApiResponse<PayrollPolicyDto>.Ok(policy.ToDto(), command.IsActive ? "Payroll policy activated." : "Payroll policy deactivated.");
    }

    public Task<ApiResponse<IReadOnlyList<PayrollPolicyDto>>> Handle(GetPayrollPolicyQuery query, CancellationToken cancellationToken)
    {
        var policies = db.PayrollPolicies
            .Where(x => (!query.Id.HasValue || x.Id == query.Id) && (!query.CompanyId.HasValue || x.CompanyId == query.CompanyId))
            .OrderBy(x => x.PolicyName)
            .Select(x => x.ToDto())
            .ToList();
        return Task.FromResult(ApiResponse<IReadOnlyList<PayrollPolicyDto>>.Ok(policies));
    }
}

public static class CacheKeys
{
    public static string PayrollPolicy(Guid companyId) => $"payroll:policy:{companyId}";
    public static string SalaryStructure(Guid companyId) => $"payroll:salary-structure:{companyId}";
    public static string EmployeeSalary(Guid companyId, Guid employeeId) => $"payroll:employee-salary:{companyId}:{employeeId}";
    public static string Attendance(Guid companyId, Guid employeeId, int year, int month) => $"payroll:attendance:{companyId}:{employeeId}:{year}:{month}";
}
