using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Infrastructure.Persistence;

public class AttendanceDbContext : DbContext, IAttendanceDbContext
{
    public AttendanceDbContext(DbContextOptions<AttendanceDbContext> options) : base(options) { }

    public DbSet<DailyAttendance> DailyAttendances => Set<DailyAttendance>();
    public DbSet<DeviceLog> DeviceLogs => Set<DeviceLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DailyAttendance>(entity =>
        {
            entity.HasIndex(e => new { e.CompanyId, e.EmployeeId, e.AttendanceDate }).IsUnique();
        });

        modelBuilder.Entity<DeviceLog>(entity =>
        {
            entity.HasIndex(e => new { e.CompanyId, e.EmployeeCode, e.PunchTime }).IsUnique();
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return base.SaveChangesAsync(cancellationToken);
    }
}
