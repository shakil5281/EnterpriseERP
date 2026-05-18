using Microsoft.EntityFrameworkCore;



namespace AttendanceService.Infrastructure.Persistence.PunchData;



public sealed class PunchDataReadDbContext(DbContextOptions<PunchDataReadDbContext> options) : DbContext(options)

{

    public DbSet<PunchRecordEntity> PunchRecords => Set<PunchRecordEntity>();



    protected override void OnModelCreating(ModelBuilder modelBuilder)

    {

        modelBuilder.Entity<PunchRecordEntity>(entity =>

        {

            entity.ToTable("PunchRecords");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Id).HasColumnName("Id").HasMaxLength(36);

            entity.Property(x => x.CompanyId).HasColumnName("CompanyId");

            entity.Property(x => x.PunchNumber).HasColumnName("PunchNumber");

            entity.Property(x => x.DeviceId).HasColumnName("DeviceId").HasMaxLength(64);

            entity.Property(x => x.PunchTime).HasColumnName("PunchTime");

        });

    }

}

