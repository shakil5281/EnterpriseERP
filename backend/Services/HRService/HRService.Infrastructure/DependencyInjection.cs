using HRService.Application.Employees;
using HRService.Application.Manpower;
using HRService.Infrastructure.Persistence;
using HRService.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HRService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddHrInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<HrDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("HrDb"),
                sql =>
                {
                    sql.EnableRetryOnFailure();
                    sql.MigrationsAssembly(typeof(HrDbContext).Assembly.GetName().Name);
                }));

        services.AddScoped<IEmployeeReadService, EmployeeReadService>();
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<IManpowerRequirementService, ManpowerRequirementService>();
        return services;
    }
}
