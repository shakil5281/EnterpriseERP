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
            entity.Property(e => e.EmployeeId).HasColumnName("HrEmployeeId");
            entity.Property(e => e.PunchNumber).IsRequired();
            entity.Property(e => e.EmployeeID).HasMaxLength(32).IsRequired();
            entity.HasIndex(e => new { e.CompanyId, e.EmployeeId, e.AttendanceDate }).IsUnique();
            entity.HasIndex(e => new { e.CompanyId, e.PunchNumber, e.AttendanceDate });
        });

        modelBuilder.Entity<DeviceLog>(entity =>
        {
            entity.Property(e => e.EmployeeId).HasColumnName("HrEmployeeId");
            entity.Property(e => e.EmployeeID).HasMaxLength(32).IsRequired();
            entity.Property(e => e.PunchNumber).IsRequired();
            entity.Property(e => e.DeviceSerial).HasMaxLength(450);
            entity.HasIndex(e => new { e.CompanyId, e.PunchNumber, e.PunchTime, e.DeviceSerial })
                .IsUnique()
                .HasFilter("[DeviceSerial] IS NOT NULL");
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return base.SaveChangesAsync(cancellationToken);
    }
}
