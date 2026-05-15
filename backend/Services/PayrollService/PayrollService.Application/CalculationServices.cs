using PayrollService.Domain.Entities;

namespace PayrollService.Application;

public sealed class OvertimeCalculationService : IOvertimeCalculationService
{
    public (decimal RatePerHour, decimal Amount) Calculate(PayrollPolicy policy, EmployeeSalary salary, decimal overtimeHours, decimal fixedRate = 0)
    {
        if (!policy.AllowOvertime || overtimeHours <= 0 || string.Equals(policy.OvertimeCalculationType, "None", StringComparison.OrdinalIgnoreCase))
        {
            return (0, 0);
        }

        var divisor = policy.OvertimeDivisor <= 0 ? 208 : policy.OvertimeDivisor;
        var multiplier = policy.OvertimeMultiplier <= 0 ? 2 : policy.OvertimeMultiplier;
        var rate = policy.OvertimeCalculationType switch
        {
            "GrossSalaryBased" => salary.GrossSalary / divisor * multiplier,
            "FixedRate" => fixedRate,
            _ => salary.BasicSalary / divisor * multiplier,
        };

        return (decimal.Round(rate, 2, MidpointRounding.AwayFromZero), decimal.Round(rate * overtimeHours, 2, MidpointRounding.AwayFromZero));
    }
}

public sealed class BonusCalculationService : IBonusCalculationService
{
    public decimal CalculateAttendanceBonus(PayrollPolicy policy, AttendanceSummary attendance, decimal configuredAmount, decimal allowedLateLimit)
    {
        if (!policy.AllowAttendanceBonus || !attendance.IsApproved)
        {
            return 0;
        }

        if (attendance.AbsentDays > 0 || attendance.LeaveWithoutPayDays > 0 || attendance.MissingPunchDays > 0 || attendance.LateDays > allowedLateLimit)
        {
            return 0;
        }

        return configuredAmount;
    }

    public decimal CalculateFestivalBonus(decimal grossSalary, DateOnly joinDate, DateOnly bonusDate)
    {
        var months = ((bonusDate.Year - joinDate.Year) * 12) + bonusDate.Month - joinDate.Month;
        if (bonusDate.Day < joinDate.Day)
        {
            months--;
        }

        return months switch
        {
            >= 12 => decimal.Round(grossSalary / 2, 2, MidpointRounding.AwayFromZero),
            >= 6 => decimal.Round(grossSalary / 4, 2, MidpointRounding.AwayFromZero),
            _ => 0,
        };
    }
}

public sealed class PayrollCalculationService(IOvertimeCalculationService overtimeCalculationService, IBonusCalculationService bonusCalculationService) : IPayrollCalculationService
{
    public PayrollCalculationResult Calculate(PayrollPolicy policy, EmployeeSalary salary, AttendanceSummary attendance, PayrollCalculationInputs inputs)
    {
        if (policy.UseApprovedAttendanceOnly && !attendance.IsApproved)
        {
            throw new InvalidOperationException("Attendance summary must be approved before payroll processing.");
        }

        var totalDays = policy.MonthDayCalculationType switch
        {
            "CalendarDays" => attendance.TotalDays,
            "WorkingDays" => attendance.WorkingDays,
            "FixedDays" => policy.FixedMonthDays ?? 30,
            _ => attendance.TotalDays > 0 ? attendance.TotalDays : 30,
        };
        totalDays = totalDays <= 0 ? 30 : totalDays;

        var perDaySalary = salary.GrossSalary / totalDays;
        var absentDeduction = policy.AllowAbsentDeduction ? perDaySalary * attendance.AbsentDays : 0;
        var lwpDeduction = perDaySalary * attendance.LeaveWithoutPayDays;
        var lateDeduction = policy.AllowLateDeduction ? perDaySalary * attendance.LateDays : 0;
        var payableSalary = salary.GrossSalary - absentDeduction - lwpDeduction;

        var overtimeHours = decimal.Round(attendance.OvertimeMinutes / 60m, 2, MidpointRounding.AwayFromZero);
        var (otRate, otAmount) = overtimeCalculationService.Calculate(policy, salary, overtimeHours);
        var tiffin = policy.AllowTiffinBill ? attendance.ApprovedTiffinDays * inputs.TiffinRate : 0;
        var night = policy.AllowNightBill ? attendance.ApprovedNightDutyDays * inputs.NightBillRate : 0;
        var attendanceBonus = bonusCalculationService.CalculateAttendanceBonus(policy, attendance, inputs.AttendanceBonusAmount, inputs.AllowedLateLimit);
        var earnLeave = policy.AllowEarnLeaveEncashment ? inputs.EarnLeaveEncashmentAmount : 0;

        var attendanceDeduction = absentDeduction + lwpDeduction;
        var totalEarnings = salary.GrossSalary + otAmount + tiffin + night + attendanceBonus + earnLeave;
        var totalDeduction = attendanceDeduction + lateDeduction + inputs.AdvanceDeduction + inputs.LoanDeduction + inputs.TaxDeduction + inputs.ProvidentFundDeduction + inputs.OtherDeduction;
        var netSalary = totalEarnings - totalDeduction;

        return new PayrollCalculationResult(
            totalDays,
            decimal.Round(perDaySalary, 2, MidpointRounding.AwayFromZero),
            decimal.Round(payableSalary, 2, MidpointRounding.AwayFromZero),
            decimal.Round(attendanceDeduction, 2, MidpointRounding.AwayFromZero),
            decimal.Round(lateDeduction, 2, MidpointRounding.AwayFromZero),
            overtimeHours,
            otRate,
            otAmount,
            decimal.Round(tiffin, 2, MidpointRounding.AwayFromZero),
            decimal.Round(night, 2, MidpointRounding.AwayFromZero),
            decimal.Round(attendanceBonus, 2, MidpointRounding.AwayFromZero),
            decimal.Round(earnLeave, 2, MidpointRounding.AwayFromZero),
            decimal.Round(totalEarnings, 2, MidpointRounding.AwayFromZero),
            decimal.Round(totalDeduction, 2, MidpointRounding.AwayFromZero),
            decimal.Round(netSalary, 2, MidpointRounding.AwayFromZero));
    }
}

public sealed class FinalSettlementService : IFinalSettlementService
{
    public decimal CalculateNetPayable(FinalSettlement settlement)
    {
        return settlement.SalaryPayable
            + settlement.EarnLeaveAmount
            + settlement.ServiceBenefitAmount
            + settlement.GratuityAmount
            - settlement.AdvanceDeduction
            - settlement.OtherDeduction;
    }
}
