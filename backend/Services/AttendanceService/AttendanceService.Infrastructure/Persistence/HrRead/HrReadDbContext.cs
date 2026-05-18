using Microsoft.EntityFrameworkCore;



namespace AttendanceService.Infrastructure.Persistence.HrRead;



public sealed class HrReadDbContext(DbContextOptions<HrReadDbContext> options) : DbContext(options)

{

    public DbSet<HrEmployeeEntity> Employees => Set<HrEmployeeEntity>();



    protected override void OnModelCreating(ModelBuilder modelBuilder)

    {

        modelBuilder.Entity<HrEmployeeEntity>(entity =>

        {

            entity.ToTable("Employees");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.PunchNumber).HasColumnName("PunchNumber");

            entity.Property(x => x.EmployeeID).HasColumnName("EmployeeID").HasMaxLength(32);

        });

    }

}

