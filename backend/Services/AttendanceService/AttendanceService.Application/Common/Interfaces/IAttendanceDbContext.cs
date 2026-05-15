using AttendanceService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Application.Common.Interfaces;

public interface IAttendanceDbContext
{
    DbSet<DailyAttendance> DailyAttendances { get; }
    DbSet<DeviceLog> DeviceLogs { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
