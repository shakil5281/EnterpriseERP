using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using AttendanceService.Infrastructure.Persistence;
using AttendanceService.Infrastructure.Persistence.PunchData;
using AttendanceService.Infrastructure.Persistence.HrRead;
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

        var punchDataCs = configuration.GetConnectionString("PunchDataDb");
        if (!string.IsNullOrWhiteSpace(punchDataCs))
        {
            services.AddDbContext<PunchDataReadDbContext>(options => options.UseSqlServer(punchDataCs));
            services.AddScoped<IPunchRecordReader, PunchRecordReader>();
        }

        var hrCs = configuration.GetConnectionString("HrDb");
        if (!string.IsNullOrWhiteSpace(hrCs))
        {
            services.AddDbContext<HrReadDbContext>(options => options.UseSqlServer(hrCs));
            services.AddScoped<IEmployeeDirectory, HrEmployeeDirectory>();
        }

        services.AddScoped<IAttendanceProcessingService, AttendanceProcessingService>();
        services.AddScoped<IAttendanceDbContext>(provider => provider.GetRequiredService<AttendanceDbContext>());
        services.AddSingleton<IPunchCompanyIdResolver, PunchCompanyIdResolver>();

        services.AddHttpClient<IShiftServiceClient, ShiftServiceClient>(client =>
        {
            client.BaseAddress = new Uri(configuration["ExternalServices:ShiftServiceUrl"] ?? "http://localhost:5005/");
        });

        return services;
    }
}
