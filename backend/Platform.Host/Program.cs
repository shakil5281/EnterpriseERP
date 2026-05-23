using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.Extensions.FileProviders;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authorization;
using AuthService.Api.Controllers;
using AuthService.Api.Middleware;
using EnterpriseERP.Platform.Host.Middleware;
using AuthService.Application;
using AuthService.Infrastructure;
using AuthService.Infrastructure.Identity;
using AuthService.Infrastructure.Options;
using AuthService.Infrastructure.Persistence;
using CompanyService.Api.Controllers;
using CompanyService.Domain.Entities;
using CompanyService.Infrastructure;
using CompanyService.Infrastructure.Persistence;
using HRService.Api.Controllers;
using HRService.Domain.Entities;
using HRService.Infrastructure;
using HRService.Infrastructure.Persistence;
using AttendanceService.Api.Controllers;
using AttendanceService.Application;
using AttendanceService.Infrastructure;
using AttendanceService.Infrastructure.Persistence;
using LeaveService.Api.Authorization;
using LeaveService.Api.Controllers;
using LeaveService.Application;
using LeaveService.Infrastructure;
using LeaveService.Infrastructure.Persistence;
using ShiftService.Api.Controllers;
using ShiftService.Application;
using ShiftService.Infrastructure;
using ShiftService.Infrastructure.Persistence;
using PayrollService.Api.Controllers;
using PayrollService.Application;
using PayrollService.Domain.Enums;
using PayrollService.Infrastructure;
using PayrollService.Infrastructure.Persistence;
using NotificationService.Api.Controllers;
using NotificationService.Infrastructure;
using NotificationService.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Erp.BuildingBlocks.Hosting;
using Erp.BuildingBlocks.CommonSecurity;
using AuthService.Application.Abstractions.CompanyAccess;
using EnterpriseERP.Platform.Host.Services;
using Asp.Versioning;
using FinishingService.API.Controllers;
using FinishingService.Infrastructure;
using QualityService.API.Controllers;
using QualityService.Infrastructure;
using SecurityService.API.Controllers;
using SecurityService.Application;
using SecurityService.Infrastructure;
using AccountsService.API.Controllers;
using AccountsService.Application;
using AccountsService.Domain;
using AccountsService.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder.AddEnterpriseErpConnectionConfiguration();

builder.Host.UseSerilog((ctx, cfg) =>
{
    cfg.ReadFrom.Configuration(ctx.Configuration);
    cfg.Enrich.FromLogContext();
    cfg.WriteTo.Console();
});

builder.Services.AddEnterpriseTenantSecurity(builder.Configuration);
builder.Services.AddScoped<ITenantCompanyAccessResolver, AuthTenantCompanyAccessResolver>();
builder.Services.AddScoped<ICompanyExistenceChecker, CompanyExistenceChecker>();
builder.Services.AddAuthApplication();
builder.Services.AddAuthInfrastructure(builder.Configuration);
builder.Services.AddCompanyInfrastructure(builder.Configuration);
builder.Services.AddHrInfrastructure(builder.Configuration);
builder.Services.AddAttendanceApplication();
builder.Services.AddAttendanceInfrastructure(builder.Configuration);
builder.Services.AddLeaveApplication();
builder.Services.AddLeaveInfrastructure(builder.Configuration);
builder.Services.AddShiftApplication();
builder.Services.AddShiftInfrastructure(builder.Configuration);
builder.Services.AddScoped<ShiftService.Application.Common.Interfaces.ILeaveCalendarProvider, EnterpriseERP.Platform.Host.Integration.LeaveCalendarProvider>();
builder.Services.AddPayrollApplication();
builder.Services.AddPayrollInfrastructure(builder.Configuration);
builder.Services.AddScoped<PayrollService.Application.IEmployeeServiceClient, EnterpriseERP.Platform.Host.Integration.PayrollInProcessEmployeeClient>();
builder.Services.AddNotificationInfrastructure(builder.Configuration);

// Bootstrapping newly integrated ERP microservices
builder.Services.AddFinishingInfrastructure(builder.Configuration);
QualityService.Infrastructure.DependencyInjection.AddInfrastructure(builder.Services, builder.Configuration);
builder.Services.AddSecurityApplication();
builder.Services.AddSecurityInfrastructure(builder.Configuration);
builder.Services.AddAccountsApplication();
builder.Services.AddAccountsInfrastructure(builder.Configuration);

// Add ASP.NET Core API Versioning support for route segments like api/v{version:apiVersion}
builder.Services.AddApiVersioning(o =>
{
    o.DefaultApiVersion = new ApiVersion(1, 0);
    o.AssumeDefaultVersionWhenUnspecified = true;
    o.ReportApiVersions = true;
    o.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new HeaderApiVersionReader("X-Api-Version")
    );
}).AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'VVV";
    options.SubstituteApiVersionInUrl = true;
});

builder.Services.AddFluentValidationAutoValidation();

builder.Services.AddControllers()
    .AddApplicationPart(typeof(AuthService.Api.Controllers.AuthController).Assembly)
    .AddApplicationPart(typeof(CompaniesController).Assembly)
    .AddApplicationPart(typeof(EmployeesController).Assembly)
    .AddApplicationPart(typeof(AttendanceController).Assembly)
    .AddApplicationPart(typeof(LeaveTypesController).Assembly)
    .AddApplicationPart(typeof(ShiftsController).Assembly)
    .AddApplicationPart(typeof(PayrollController).Assembly)
    .AddApplicationPart(typeof(NotificationsController).Assembly)
    .AddApplicationPart(typeof(FinishingReceivesController).Assembly)
    .AddApplicationPart(typeof(FinalInspectionsController).Assembly)
    .AddApplicationPart(typeof(SecurityService.API.Controllers.GatesController).Assembly)
    .AddApplicationPart(typeof(VouchersController).Assembly)
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition =
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Enterprise ERP API", Version = "v1" });
    options.CustomSchemaIds(type => (type.FullName ?? type.Name).Replace('+', '.'));
    options.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme.",
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" },
            },
            Array.Empty<string>()
        },
    });
});

var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
if (string.IsNullOrWhiteSpace(jwt.SigningKey) || jwt.SigningKey.Length < 32)
{
    throw new InvalidOperationException("Configure Jwt:SigningKey (min 32 characters) in configuration.");
}

if (string.IsNullOrWhiteSpace(jwt.Issuer) || string.IsNullOrWhiteSpace(jwt.Audience))
{
    throw new InvalidOperationException("Jwt:Issuer and Jwt:Audience must be set.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = "sub",
            RoleClaimType = ClaimTypes.Role,
        };
    });

builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionAuthorizationPolicyProvider>();
builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(PayrollPermissions.PayrollPolicyManage, p => p.RequireRole(PayrollRoles.SuperAdmin));
    options.AddPolicy(PayrollPermissions.SalaryStructureManage, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.HRManager));
    options.AddPolicy(PayrollPermissions.EmployeeSalaryManage, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.HRManager));
    options.AddPolicy(PayrollPermissions.SalaryIncrementRequest, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.HRManager));
    options.AddPolicy(PayrollPermissions.SalaryIncrementApprove, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin));
    options.AddPolicy(PayrollPermissions.SalaryAdvanceRequest, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.HRManager, PayrollRoles.PayrollOfficer));
    options.AddPolicy(PayrollPermissions.SalaryAdvanceApprove, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.AccountsOfficer));
    options.AddPolicy(PayrollPermissions.PayrollProcess, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.PayrollOfficer));
    options.AddPolicy(PayrollPermissions.PayrollReprocess, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin));
    options.AddPolicy(PayrollPermissions.PayrollApprove, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin));
    options.AddPolicy(PayrollPermissions.PayrollLock, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin));
    options.AddPolicy(PayrollPermissions.PayrollUnlock, p => p.RequireRole(PayrollRoles.SuperAdmin));
    options.AddPolicy(PayrollPermissions.PayslipView, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.PayrollOfficer, PayrollRoles.Employee));
    options.AddPolicy(PayrollPermissions.SalarySheetView, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.PayrollOfficer, PayrollRoles.AccountsOfficer, PayrollRoles.Auditor));
    options.AddPolicy(PayrollPermissions.BankSheetExport, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.AccountsOfficer));
    options.AddPolicy(PayrollPermissions.FinalSettlementProcess, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.HRManager));
    options.AddPolicy(PayrollPermissions.FinalSettlementApprove, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin));
    options.AddPolicy(AccountsPermissions.CoaManage, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.GroupAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.VoucherCreate, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.AccountsOfficer));
    options.AddPolicy(AccountsPermissions.VoucherApprove, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.VoucherPost, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.AccountsOfficer));
    options.AddPolicy(AccountsPermissions.CashReceiveCreate, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.AccountsOfficer, AccountsRoles.Cashier));
    options.AddPolicy(AccountsPermissions.CashReceiveApprove, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.DailyExpenseCreate, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.AccountsOfficer, AccountsRoles.Cashier));
    options.AddPolicy(AccountsPermissions.DailyExpenseApprove, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.MoneyRequestCreate, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.AccountsOfficer));
    options.AddPolicy(AccountsPermissions.MoneyRequestApprove, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.AdvancePayCreate, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.AccountsOfficer));
    options.AddPolicy(AccountsPermissions.AdvancePayApprove, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.AdvanceSalaryPayCreate, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.AccountsOfficer));
    options.AddPolicy(AccountsPermissions.AdvanceSalaryPayApprove, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.CompanyTransferCreate, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.CompanyTransferApprove, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.LedgerView, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.AccountsOfficer, AccountsRoles.Auditor, AccountsRoles.Viewer));
    options.AddPolicy(AccountsPermissions.ReportView, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.Auditor, AccountsRoles.Viewer));
});

var configuredCorsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("platform", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin))
                {
                    return false;
                }

                if (configuredCorsOrigins.Length > 0 && configuredCorsOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
                {
                    return true;
                }

                if (!builder.Environment.IsDevelopment())
                {
                    return false;
                }

                try
                {
                    var uri = new Uri(origin);
                    return uri.Host is "localhost" or "127.0.0.1";
                }
                catch (UriFormatException)
                {
                    return false;
                }
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddHealthChecks()
    .AddDbContextCheck<AuthDbContext>("auth-db")
    .AddDbContextCheck<CompanyDbContext>("company-db")
    .AddDbContextCheck<HrDbContext>("hr-db")
    .AddDbContextCheck<AttendanceDbContext>("attendance-db")
    .AddDbContextCheck<LeaveDbContext>("leave-db")
    .AddDbContextCheck<ShiftDbContext>("shift-db")
    .AddDbContextCheck<PayrollDbContext>("payroll-db")
    .AddDbContextCheck<NotificationDbContext>("notification-db");

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("per-ip", httpContext =>
    {
        if (HttpMethods.IsOptions(httpContext.Request.Method))
        {
            return RateLimitPartition.GetNoLimiter("preflight");
        }

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 300,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 20,
            });
    });
});

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

var companyUploadRoot = Path.Combine(
    app.Environment.ContentRootPath,
    app.Configuration["CompanyFiles:UploadRoot"] ?? "uploads");
Directory.CreateDirectory(companyUploadRoot);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(companyUploadRoot),
    RequestPath = "/uploads",
});

app.UseSerilogRequestLogging();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<PlatformExceptionHandlingMiddleware>();
app.UseCors("platform");
app.UseRateLimiter();

app.Use(async (ctx, next) =>
{
    if (HttpMethods.IsGet(ctx.Request.Method) && ctx.Request.Path == "/")
    {
        ctx.Response.ContentType = "application/json; charset=utf-8";
        await ctx.Response.WriteAsJsonAsync(new
        {
            service = "EnterpriseERP.Platform.Host",
            health = "/health",
            swagger = "/swagger",
            api = "/api/v1/...",
            hint = "Single-process host: Auth, Company, HR, Attendance, Leave, Shift, Payroll, Notification on this port. Add ReverseProxy routes in appsettings to forward paths to a legacy monolith (e.g. :5011).",
        });
        return;
    }

    await next(ctx);
});

app.UseSwagger();
app.UseSwaggerUI(o =>
{
    o.SwaggerEndpoint("/swagger/v1/swagger.json", "Core Services (Platform Host)");
    if (app.Configuration.GetValue("Swagger:IncludeGoServiceSpecs", false))
    {
        o.SwaggerEndpoint("/api/v1/punch-data/swagger/doc.json", "Punch Data Service (Go)");
        o.SwaggerEndpoint("/api/v1/import-export/swagger/doc.json", "Import Export Service (Go)");
    }

    o.RoutePrefix = "swagger";
});

app.UseAuthentication();
app.UseEnterpriseTenantSecurity();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapControllers().RequireRateLimiting("per-ip");
app.MapReverseProxy().RequireRateLimiting("per-ip");

await using (var scope = app.Services.CreateAsyncScope())
{
    var companyDb = scope.ServiceProvider.GetRequiredService<CompanyDbContext>();
    await companyDb.Database.MigrateAsync();
    if (!await companyDb.Companies.AnyAsync())
    {
        companyDb.Companies.Add(new Company
        {
            Id = Guid.NewGuid(),
            CompanyNameEn = "Default Company",
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
        });
        await companyDb.SaveChangesAsync();
    }

    var hrDb = scope.ServiceProvider.GetRequiredService<HrDbContext>();
    await hrDb.Database.MigrateAsync();
    if (!await hrDb.Employees.AnyAsync())
    {
        var companyId = await companyDb.Companies.Select(c => c.Id).FirstAsync();
        var grade = new Grade { Id = Guid.NewGuid(), Name = "G1", CreatedAt = DateTimeOffset.UtcNow };
        var dept = new HRService.Domain.Entities.Department { Id = Guid.NewGuid(), CompanyId = companyId, Name = "Operations", CreatedAt = DateTimeOffset.UtcNow };
        var desig = new HRService.Domain.Entities.Designation { Id = Guid.NewGuid(), GradeId = grade.Id, Name = "Officer", CreatedAt = DateTimeOffset.UtcNow };
        hrDb.Grades.Add(grade);
        hrDb.Departments.Add(dept);
        hrDb.Designations.Add(desig);
        await hrDb.SaveChangesAsync();

        var emp = new Employee
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            PunchNumber = 1,
            EmployeeID = "EMP-0001",
            FullName = "Sample Employee",
            Email = "sample@erp.local",
            JoinDate = DateTime.UtcNow.Date,
            EmploymentType = "Permanent",
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
        };

        emp.JobInfos.Add(new EmployeeJobInfo
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            DepartmentId = dept.Id,
            DesignationId = desig.Id,
            GradeId = grade.Id,
            EffectiveFrom = emp.JoinDate,
            IsCurrent = true,
        });

        emp.SalaryInfos.Add(new EmployeeSalaryInfo
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            BasicSalary = 50000,
            GrossSalary = 50000,
            EffectiveFrom = emp.JoinDate,
            IsCurrent = true,
        });
        hrDb.Employees.Add(emp);
        await hrDb.SaveChangesAsync();
    }

    var authDb = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    var users = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    var roles = scope.ServiceProvider.GetRequiredService<RoleManager<AppRole>>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("AuthDataSeeder");
    var defaultCompanyId = await companyDb.Companies.Select(c => c.Id).FirstOrDefaultAsync();
    await AuthDataSeeder.SeedAsync(authDb, users, roles, logger, defaultCompanyId == Guid.Empty ? null : defaultCompanyId);
    var superAdmin = await users.FindByNameAsync("superadmin");
    if (superAdmin is not null && defaultCompanyId != Guid.Empty)
    {
        await AuthDataSeeder.EnsureUserCompanyAccessAsync(authDb, superAdmin.Id, defaultCompanyId, logger);
    }

    var attendanceDb = scope.ServiceProvider.GetRequiredService<AttendanceDbContext>();
    var leaveDb = scope.ServiceProvider.GetRequiredService<LeaveDbContext>();
    var shiftDb = scope.ServiceProvider.GetRequiredService<ShiftDbContext>();
    var payrollDb = scope.ServiceProvider.GetRequiredService<PayrollDbContext>();
    var notificationDb = scope.ServiceProvider.GetRequiredService<NotificationDbContext>();

    var finishingDb = scope.ServiceProvider.GetRequiredService<FinishingService.Infrastructure.Persistence.FinishingDbContext>();
    var qualityDb = scope.ServiceProvider.GetRequiredService<QualityService.Infrastructure.Persistence.QualityDbContext>();
    var securityDb = scope.ServiceProvider.GetRequiredService<SecurityService.Infrastructure.Persistence.SecurityDbContext>();
    var accountsDb = scope.ServiceProvider.GetRequiredService<AccountsService.Infrastructure.Persistence.AccountsDbContext>();

    if (!app.Configuration.GetValue("PlatformHost:SkipServiceDatabaseMigrations", false))
    {
        await attendanceDb.Database.MigrateAsync();

        if (app.Configuration.GetValue("PlatformHost:RunLeaveDatabaseMigration", true))
        {
            await leaveDb.Database.MigrateAsync();
        }

        await shiftDb.Database.MigrateAsync();
        await ShiftService.Application.Common.ShiftPolicyProvisioning.BackfillAllShiftsAsync(shiftDb);
        await payrollDb.Database.MigrateAsync();
        await notificationDb.Database.MigrateAsync();

        await finishingDb.Database.MigrateAsync();
        await qualityDb.Database.MigrateAsync();
        await securityDb.Database.MigrateAsync();
        await accountsDb.Database.MigrateAsync();
    }
}

await app.RunAsync();
