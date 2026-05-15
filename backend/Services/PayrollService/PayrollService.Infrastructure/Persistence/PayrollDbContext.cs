using Microsoft.EntityFrameworkCore;
using PayrollService.Application;
using PayrollService.Domain.Entities;

namespace PayrollService.Infrastructure.Persistence;

public sealed class PayrollDbContext(DbContextOptions<PayrollDbContext> options) : DbContext(options), IPayrollDbContext
{
    public DbSet<PayrollPolicy> PayrollPolicies => Set<PayrollPolicy>();
    public DbSet<SalaryStructure> SalaryStructures => Set<SalaryStructure>();
    public DbSet<SalaryStructureComponent> SalaryStructureComponents => Set<SalaryStructureComponent>();
    public DbSet<EmployeeSalary> EmployeeSalaries => Set<EmployeeSalary>();
    public DbSet<SalaryIncrementRequestEntity> SalaryIncrementRequests => Set<SalaryIncrementRequestEntity>();
    public DbSet<PayrollPeriod> PayrollPeriods => Set<PayrollPeriod>();
    public DbSet<PayrollRun> PayrollRuns => Set<PayrollRun>();
    public DbSet<EmployeePayroll> EmployeePayrolls => Set<EmployeePayroll>();
    public DbSet<PayrollEarning> PayrollEarnings => Set<PayrollEarning>();
    public DbSet<PayrollDeduction> PayrollDeductions => Set<PayrollDeduction>();
    public DbSet<SalaryAdvance> SalaryAdvances => Set<SalaryAdvance>();
    public DbSet<SalaryAdvanceInstallment> SalaryAdvanceInstallments => Set<SalaryAdvanceInstallment>();
    public DbSet<AllowanceBill> AllowanceBills => Set<AllowanceBill>();
    public DbSet<PayrollApproval> PayrollApprovals => Set<PayrollApproval>();
    public DbSet<PayrollLock> PayrollLocks => Set<PayrollLock>();
    public DbSet<FinalSettlement> FinalSettlements => Set<FinalSettlement>();
    public DbSet<PayrollDeductionEntry> PayrollDeductionEntries => Set<PayrollDeductionEntry>();
    public DbSet<PayrollAuditLog> PayrollAuditLogs => Set<PayrollAuditLog>();

    IQueryable<PayrollPolicy> IPayrollDbContext.PayrollPolicies => PayrollPolicies;
    IQueryable<SalaryStructure> IPayrollDbContext.SalaryStructures => SalaryStructures;
    IQueryable<SalaryStructureComponent> IPayrollDbContext.SalaryStructureComponents => SalaryStructureComponents;
    IQueryable<EmployeeSalary> IPayrollDbContext.EmployeeSalaries => EmployeeSalaries;
    IQueryable<SalaryIncrementRequestEntity> IPayrollDbContext.SalaryIncrementRequests => SalaryIncrementRequests;
    IQueryable<PayrollPeriod> IPayrollDbContext.PayrollPeriods => PayrollPeriods;
    IQueryable<PayrollRun> IPayrollDbContext.PayrollRuns => PayrollRuns;
    IQueryable<EmployeePayroll> IPayrollDbContext.EmployeePayrolls => EmployeePayrolls;
    IQueryable<PayrollEarning> IPayrollDbContext.PayrollEarnings => PayrollEarnings;
    IQueryable<PayrollDeduction> IPayrollDbContext.PayrollDeductions => PayrollDeductions;
    IQueryable<SalaryAdvance> IPayrollDbContext.SalaryAdvances => SalaryAdvances;
    IQueryable<SalaryAdvanceInstallment> IPayrollDbContext.SalaryAdvanceInstallments => SalaryAdvanceInstallments;
    IQueryable<AllowanceBill> IPayrollDbContext.AllowanceBills => AllowanceBills;
    IQueryable<PayrollApproval> IPayrollDbContext.PayrollApprovals => PayrollApprovals;
    IQueryable<PayrollLock> IPayrollDbContext.PayrollLocks => PayrollLocks;
    IQueryable<FinalSettlement> IPayrollDbContext.FinalSettlements => FinalSettlements;
    IQueryable<PayrollDeductionEntry> IPayrollDbContext.PayrollDeductionEntries => PayrollDeductionEntries;
    IQueryable<PayrollAuditLog> IPayrollDbContext.PayrollAuditLogs => PayrollAuditLogs;

    void IPayrollDbContext.Add<TEntity>(TEntity entity) => Set<TEntity>().Add(entity);

    void IPayrollDbContext.Remove<TEntity>(TEntity entity) => Set<TEntity>().Remove(entity);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PayrollDbContext).Assembly);
        SeedPayrollPolicies(modelBuilder);
    }

    private static void SeedPayrollPolicies(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PayrollPolicy>().HasData(
            new PayrollPolicy
            {
                Id = Guid.Parse("10000000-0000-0000-0000-000000000001"),
                CompanyId = Guid.Parse("20000000-0000-0000-0000-000000000001"),
                PolicyName = "Unity General Duty Monthly",
                SalaryCalculationType = "Monthly",
                MonthDayCalculationType = "FixedDays",
                FixedMonthDays = 30,
                AllowOvertime = true,
                AllowTiffinBill = false,
                AllowNightBill = false,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            },
            new PayrollPolicy
            {
                Id = Guid.Parse("10000000-0000-0000-0000-000000000002"),
                CompanyId = Guid.Parse("20000000-0000-0000-0000-000000000002"),
                PolicyName = "Ekushe General Duty Monthly",
                SalaryCalculationType = "Monthly",
                MonthDayCalculationType = "CalendarDays",
                AllowOvertime = true,
                AllowTiffinBill = true,
                AllowAttendanceBonus = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            },
            new PayrollPolicy
            {
                Id = Guid.Parse("10000000-0000-0000-0000-000000000003"),
                CompanyId = Guid.Parse("20000000-0000-0000-0000-000000000003"),
                PolicyName = "Dyeing Shift Monthly",
                SalaryCalculationType = "Monthly",
                MonthDayCalculationType = "FixedDays",
                FixedMonthDays = 30,
                AllowOvertime = true,
                AllowTiffinBill = true,
                AllowNightBill = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            });
    }
}
