using Erp.BuildingBlocks.EventBus;
using LeaveService.Application.Common.Interfaces;
using LeaveService.Infrastructure.Caching;
using LeaveService.Infrastructure.External;
using LeaveService.Infrastructure.Messaging;
using LeaveService.Infrastructure.Persistence;
using LeaveService.Infrastructure.Repositories;
using LeaveService.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace LeaveService.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddLeaveInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var cs =
            configuration.GetConnectionString("LeaveDb")
            ?? configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<LeaveDbContext>(options =>
            options.UseSqlServer(cs, b => b.MigrationsAssembly(typeof(LeaveDbContext).Assembly.FullName)));

        services.AddScoped<ILeaveUnitOfWork, LeaveUnitOfWork>();
        services.AddScoped<ILeaveDayCalculator, LeaveDayCalculatorService>();
        services.AddScoped<ILeaveBalanceService, LeaveBalanceService>();
        services.AddScoped<ILeaveAuditService, LeaveAuditService>();
        services.AddScoped<IPayrollGate, PayrollGateService>();

        var redis = configuration.GetConnectionString("Redis");
        if (string.IsNullOrWhiteSpace(redis))
        {
            services.AddDistributedMemoryCache();
        }
        else
        {
            services.AddStackExchangeRedisCache(o => o.Configuration = redis);
        }

        services.AddSingleton<ILeaveCache, DistributedLeaveCache>();

        services.Configure<RabbitMqPublisherOptions>(configuration.GetSection("RabbitMQ"));
        services.AddSingleton<IIntegrationMessagePublisher, RabbitMqJsonPublisher>();

        services.Configure<EmployeeServiceClientOptions>(configuration.GetSection("Services:Hr"));
        services.AddHttpClient<IEmployeeServiceClient, EmployeeServiceClient>("Leave.IEmployeeServiceClient");

        services.Configure<AttendanceServiceClientOptions>(configuration.GetSection("Services:Attendance"));
        services.AddHttpClient<IAttendanceServiceClient, AttendanceServiceClient>("Leave.IAttendanceServiceClient");

        services.Configure<PayrollServiceClientOptions>(configuration.GetSection("Services:Payroll"));
        services.AddHttpClient<IPayrollServiceClient, PayrollServiceClient>("Leave.IPayrollServiceClient");

        services.AddSingleton<INotificationServiceClient, NotificationServiceClient>();

        services.AddHostedService<LeaveIntegrationConsumer>();

        return services;
    }
}
