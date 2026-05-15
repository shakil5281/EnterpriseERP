using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using AttendanceService.Infrastructure.Persistence;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Infrastructure.Services;

namespace AttendanceService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddAttendanceInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var attendanceCs =
            configuration.GetConnectionString("AttendanceDb")
            ?? configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<AttendanceDbContext>(options =>
            options.UseSqlServer(attendanceCs));

        services.AddScoped<IAttendanceProcessingService, AttendanceProcessingService>();
        services.AddScoped<IAttendanceDbContext>(provider => provider.GetRequiredService<AttendanceDbContext>());

        // Register ShiftServiceClient with HttpClient
        services.AddHttpClient<IShiftServiceClient, ShiftServiceClient>(client =>
        {
            client.BaseAddress = new Uri(configuration["ExternalServices:ShiftServiceUrl"] ?? "http://localhost:5005/");
        });

        return services;
    }
}
