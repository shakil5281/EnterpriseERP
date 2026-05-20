using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PayrollService.Application;
using PayrollService.Infrastructure.EventBus;
using PayrollService.Infrastructure.ExternalServices;
using PayrollService.Infrastructure.Persistence;
using PayrollService.Infrastructure.Repositories;
using PayrollService.Infrastructure.Services;

namespace PayrollService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddPayrollInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("PayrollDb")
            ?? configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<PayrollDbContext>(options =>
            options.UseSqlServer(connectionString,
                b => b.MigrationsAssembly(typeof(PayrollDbContext).Assembly.FullName)));

        services.AddScoped<IPayrollDbContext>(sp => sp.GetRequiredService<PayrollDbContext>());
        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddSingleton<IRedisCacheService, RedisCacheService>();
        services.AddScoped<IIntegrationEventPublisher, RabbitMqIntegrationEventPublisher>();
        services.AddScoped<ISalaryAdvanceService, SalaryAdvanceService>();
        services.AddScoped<ISalaryIncrementService, SalaryIncrementService>();

        services.AddHttpClient<IEmployeeServiceClient, EmployeeServiceClient>("Payroll.IEmployeeServiceClient", c => c.BaseAddress = new Uri(configuration["Services:EmployeeService"] ?? configuration["Services:HR"] ?? "http://localhost:5000"));
        services.AddHttpClient<IAttendanceServiceClient, AttendanceServiceClient>("Payroll.IAttendanceServiceClient", c => c.BaseAddress = new Uri(configuration["Services:AttendanceService"] ?? "http://localhost:5102"));
        services.AddHttpClient<ILeaveServiceClient, LeaveServiceClient>("Payroll.ILeaveServiceClient", c => c.BaseAddress = new Uri(configuration["Services:LeaveService"] ?? "http://localhost:5103"));
        services.AddHttpClient<ICompanyServiceClient, CompanyServiceClient>("Payroll.ICompanyServiceClient", c => c.BaseAddress = new Uri(configuration["Services:CompanyService"] ?? "http://localhost:5104"));
        services.AddHttpClient<INotificationServiceClient, NotificationServiceClient>("Payroll.INotificationServiceClient", c => c.BaseAddress = new Uri(configuration["Services:NotificationService"] ?? "http://localhost:5105"));

        services.AddHostedService<RabbitMqConsumerHostedService>();

        return services;
    }
}
