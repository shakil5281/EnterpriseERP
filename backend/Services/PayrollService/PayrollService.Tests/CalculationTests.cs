using Microsoft.EntityFrameworkCore;
using PayrollService.Application;
using PayrollService.Application.Handlers;
using PayrollService.Contracts;
using PayrollService.Domain.Entities;
using PayrollService.Infrastructure.Persistence;
using PayrollService.Infrastructure.Services;
using Xunit;

namespace PayrollService.Tests;

public sealed class CalculationTests
{
    [Fact]
    public void Overtime_Uses_Garments_BasicSalary_Formula()
    {
        var service = new OvertimeCalculationService();
        var policy = new PayrollPolicy { AllowOvertime = true, OvertimeCalculationType = "BasicSalaryBased", OvertimeDivisor = 208, OvertimeMultiplier = 2 };
        var salary = new EmployeeSalary { BasicSalary = 20800, GrossSalary = 30000 };

        var result = service.Calculate(policy, salary, 10);

        Assert.Equal(200, result.RatePerHour);
        Assert.Equal(2000, result.Amount);
    }

    [Fact]
    public void Bonus_Uses_Job_Age_Bands()
    {
        var service = new BonusCalculationService();

        Assert.Equal(15000, service.CalculateFestivalBonus(30000, new DateOnly(2025, 1, 1), new DateOnly(2026, 5, 1)));
        Assert.Equal(7500, service.CalculateFestivalBonus(30000, new DateOnly(2025, 10, 1), new DateOnly(2026, 5, 1)));
        Assert.Equal(0, service.CalculateFestivalBonus(30000, new DateOnly(2026, 1, 1), new DateOnly(2026, 5, 1)));
    }

    [Fact]
    public void Monthly_FixedDays_Salary_Calculates_Deductions_And_Net()
    {
        var service = new PayrollCalculationService(new OvertimeCalculationService(), new BonusCalculationService());
        var policy = new PayrollPolicy
        {
            SalaryCalculationType = "Monthly",
            MonthDayCalculationType = "FixedDays",
            FixedMonthDays = 30,
            AllowOvertime = true,
            OvertimeCalculationType = "BasicSalaryBased",
            AllowAbsentDeduction = true,
            AllowTiffinBill = true,
            AllowNightBill = true,
            AllowAttendanceBonus = true,
        };
        var salary = new EmployeeSalary { GrossSalary = 30000, BasicSalary = 15600 };
        var attendance = new AttendanceSummary(Guid.NewGuid(), Guid.NewGuid(), 2026, 5, true, 31, 26, 25, 1, 0, 0, 0, 0, 0, 120, 2, 1, 0);

        var result = service.Calculate(policy, salary, attendance, new PayrollCalculationInputs());

        Assert.Equal(1000, result.AbsentDeduction);
        Assert.Equal(300, result.OvertimeAmount);
        Assert.Equal(100, result.TiffinBillAmount);
        Assert.Equal(100, result.NightBillAmount);
        Assert.Equal(30500, result.TotalEarnings);
        Assert.Equal(1000, result.TotalDeduction);
        Assert.Equal(29500, result.NetSalary);
    }
}

public sealed class PayrollProcessIntegrationTests
{
    [Fact]
    public async Task ProcessPayroll_Creates_EmployeePayroll_Earnings_Deductions_And_Run()
    {
        var options = new DbContextOptionsBuilder<PayrollDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new PayrollDbContext(options);
        var companyId = Guid.NewGuid();
        var employeeId = Guid.NewGuid();
        var period = new PayrollPeriod { CompanyId = companyId, YearNo = 2026, MonthNo = 5, StartDate = new DateOnly(2026, 5, 1), EndDate = new DateOnly(2026, 5, 31) };
        db.PayrollPeriods.Add(period);
        db.PayrollPolicies.Add(new PayrollPolicy
        {
            CompanyId = companyId,
            PolicyName = "Dyeing",
            SalaryCalculationType = "Monthly",
            MonthDayCalculationType = "FixedDays",
            FixedMonthDays = 30,
            AllowOvertime = true,
            OvertimeCalculationType = "BasicSalaryBased",
            AllowTiffinBill = true,
            AllowNightBill = true,
        });
        db.EmployeeSalaries.Add(new EmployeeSalary { CompanyId = companyId, EmployeeId = employeeId, GrossSalary = 30000, BasicSalary = 15600, EffectiveFrom = new DateOnly(2026, 1, 1), IsCurrent = true });
        await db.SaveChangesAsync();

        var handler = new ProcessPayrollHandler(
            db,
            new PayrollCalculationService(new OvertimeCalculationService(), new BonusCalculationService()),
            new SalaryAdvanceService(db),
            new FakeEmployeeClient(employeeId, companyId),
            new FakeAttendanceClient(companyId, employeeId),
            new FakeLeaveClient(),
            new FakePublisher());

        var response = await handler.Handle(new ProcessPayrollCommand(new ProcessPayrollRequest(companyId, 2026, 5, null)), CancellationToken.None);

        Assert.True(response.Success);
        Assert.Single(db.PayrollRuns);
        Assert.Single(db.EmployeePayrolls);
        Assert.NotEmpty(db.PayrollEarnings);
        Assert.Equal("Processed", db.PayrollPeriods.Single().Status);
    }

    private sealed class FakeEmployeeClient(Guid employeeId, Guid configuredCompanyId) : IEmployeeServiceClient
    {
        public Task<IReadOnlyList<EmployeeSnapshot>> GetActiveEmployeesAsync(Guid companyId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<EmployeeSnapshot>>([new EmployeeSnapshot(employeeId, configuredCompanyId, new DateOnly(2025, 1, 1), true, "001", "ERP Bank")]);

        public Task<EmployeeSnapshot?> GetEmployeeByIdAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default) => Task.FromResult<EmployeeSnapshot?>(new EmployeeSnapshot(employeeId, companyId, new DateOnly(2025, 1, 1), true));
        public Task<DateOnly?> GetEmployeeJoinDateAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default) => Task.FromResult<DateOnly?>(new DateOnly(2025, 1, 1));
        public Task<IReadOnlyList<EmployeeSnapshot>> GetResignedEmployeesAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<EmployeeSnapshot>>(Array.Empty<EmployeeSnapshot>());
    }

    private sealed class FakeAttendanceClient(Guid configuredCompanyId, Guid configuredEmployeeId) : IAttendanceServiceClient
    {
        public Task<AttendanceSummary?> GetApprovedMonthlySummaryAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default) =>
            Task.FromResult<AttendanceSummary?>(new AttendanceSummary(configuredCompanyId, configuredEmployeeId, year, month, true, 31, 26, 26, 0, 0, 0, 0, 0, 0, 120, 2, 1, 0));

        public Task<bool> IsMonthlyAttendanceApprovedAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default) => Task.FromResult(true);
    }

    private sealed class FakeLeaveClient : ILeaveServiceClient
    {
        public Task<decimal> GetApprovedLeaveEncashmentAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default) => Task.FromResult(0m);
    }

    private sealed class FakePublisher : IIntegrationEventPublisher
    {
        public Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default) where TEvent : IntegrationEvent => Task.CompletedTask;
    }
}
