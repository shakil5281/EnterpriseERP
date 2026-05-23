using AuthService.Contracts.Common;
using AuthService.Infrastructure.Entities;
using AuthService.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using Erp.BuildingBlocks.SharedKernel;

namespace AuthService.Infrastructure.Persistence;

public static class AuthDataSeeder
{
	private static readonly (string Code, string Description)[] PermissionSeeds =
	[
		("auth.users.read", "View users"),
		("auth.users.write", "Manage users"),
		("auth.roles.read", "View roles"),
		("auth.roles.write", "Manage roles"),
		("auth.permissions.read", "View permission catalog"),
		("company.read", "View companies"),
		("company.write", "Manage companies"),
		("hr.employees.read", "View employees"),
		("hr.employees.write", "Manage employees"),
		("hr.dashboard.read", "View HR dashboard"),
		("attendance.read", "View attendance"),
		("attendance.write", "Manage attendance"),
		("attendance.reports.read", "View attendance reports"),
		("attendance.process.write", "Run attendance processing"),
		("leave.read", "View leave"),
		("leave.write", "Manage leave"),
		("LEAVE_TYPE_MANAGE", "Manage leave types"),
		("LEAVE_POLICY_MANAGE", "Manage leave policies"),
		("LEAVE_BALANCE_VIEW", "View leave balances"),
		("LEAVE_BALANCE_ADJUST", "Adjust leave balances"),
		("LEAVE_APPLY", "Apply for leave"),
		("LEAVE_APPROVE", "Approve leave"),
		("LEAVE_REJECT", "Reject leave"),
		("LEAVE_CANCEL", "Cancel leave"),
		("HOLIDAY_MANAGE", "Manage holidays"),
		("WEEKLY_OFF_MANAGE", "Manage weekly offs"),
		("EARN_LEAVE_GENERATE", "Generate earn leave"),
		("LEAVE_ENCASHMENT_APPROVE", "Approve leave encashments"),
		("payroll.read", "View payroll"),
		("payroll.write", "Manage payroll"),
		("payroll.monthly.read", "View monthly payroll"),
		("payroll.process.write", "Process payroll"),
		("accounts.module.access", "Access accounts module"),
		("accounts.read", "View accounts data"),
		("accounts.write", "Manage accounts data"),
		("dataprocess.read", "View data process"),
		("dataprocess.write", "Manage data process"),
		("production.read", "View production"),
		("store.read", "View store"),
		("merchandising.read", "View merchandising"),
		("cutting.read", "View cutting"),
	];

	private static readonly (string Module, string Route, string Permission, bool Menu)[] RoutePermissionSeeds =
	[
		("Management", "/management/administrator", "auth.users.read", true),
		("Management", "/management/administrator/users", "auth.users.read", true),
		("Management", "/management/administrator/permissions", "auth.permissions.read", true),
		("Management", "/management/human-resource", "hr.employees.read", true),
		("Management", "/management/human-resource/employee-info", "hr.employees.read", true),
		("Management", "/management/attendance", "attendance.read", true),
		("Management", "/management/attendance/daily-report", "attendance.reports.read", true),
		("Management", "/management/leave", "leave.read", true),
		("Management", "/management/leave/weekly-offs", "leave.read", true),
		("Management", "/management/leave/balances", "leave.read", true),
		("Management", "/management/leave/earn-leave", "leave.read", true),
		("Management", "/management/leave/encashments", "leave.read", true),
		("Management", "/management/payroll", "payroll.read", true),
		("Management", "/management/payroll/monthly-sheet", "payroll.monthly.read", true),
		("Management", "/management/data-process", "dataprocess.read", true),
		("Management", "/management/information/company-information", "company.read", true),
		("Accounts", "/accounts", "accounts.module.access", true),
		("Production", "/production", "production.read", true),
		("Store", "/store", "store.read", true),
		("Merchandising", "/merchandising", "merchandising.read", true),
		("Cutting", "/cutting", "cutting.read", true),
	];

	public static async Task SeedAsync(
		AuthDbContext db,
		UserManager<AppUser> users,
		RoleManager<AppRole> roles,
		ILogger logger,
		Guid? defaultCompanyGuid = null,
		CancellationToken cancellationToken = default)
	{
		await db.Database.MigrateAsync(cancellationToken);

		foreach (var (code, description) in PermissionSeeds)
		{
			if (!await db.Permissions.AnyAsync(p => p.Code == code && !p.IsDeleted, cancellationToken))
			{
				db.Permissions.Add(new Permission
				{
					Id = Guid.NewGuid(),
					Code = code,
					Description = description,
					CreatedAt = BusinessTime.NowOffset,
				});
			}
		}

		await db.SaveChangesAsync(cancellationToken);

		foreach (var (module, route, permission, menu) in RoutePermissionSeeds)
		{
			if (!await db.RoutePermissions.AnyAsync(
				r => r.RoutePattern == route && r.PermissionCode == permission && !r.IsDeleted,
				cancellationToken))
			{
				db.RoutePermissions.Add(new RoutePermission
				{
					Id = Guid.NewGuid(),
					Module = module,
					RoutePattern = route,
					PermissionCode = permission,
					IsMenuRoute = menu,
					CreatedAt = BusinessTime.NowOffset,
				});
			}
		}

		await db.SaveChangesAsync(cancellationToken);

		string[] roleSeeds =
		[
			"SuperAdmin", "Admin", "User", "HR", "Management", "HR Officer", "IT Officer",
			"Accounts", "Accountant", "Account Officer", "Production", "ProductionManager",
			"Store", "StoreKeeper", "Cutting", "Merchandising", "Merchandiser",
		];

		foreach (var roleName in roleSeeds)
		{
			if (await roles.RoleExistsAsync(roleName))
			{
				continue;
			}

			var role = new AppRole
			{
				Id = Guid.NewGuid(),
				Name = roleName,
				NormalizedName = roleName.ToUpperInvariant(),
				CreatedAt = BusinessTime.NowOffset,
			};
			var result = await roles.CreateAsync(role);
			if (!result.Succeeded)
			{
				logger.LogError("Failed to create role {Role}: {Errors}", roleName, string.Join(", ", result.Errors.Select(e => e.Description)));
			}
		}

		await AssignAllPermissionsToRoleAsync(db, roles, "SuperAdmin", cancellationToken);
		await AssignPermissionsToRoleAsync(db, roles, "Admin",
			PermissionSeeds.Select(p => p.Code).Where(c => c != "auth.permissions.read").ToArray(),
			cancellationToken);
		var hrLeavePermissions = new[]
		{
			"leave.read", "leave.write",
			"LEAVE_TYPE_MANAGE", "LEAVE_POLICY_MANAGE",
			"LEAVE_BALANCE_VIEW", "LEAVE_BALANCE_ADJUST",
			"LEAVE_APPLY", "LEAVE_APPROVE", "LEAVE_REJECT", "LEAVE_CANCEL",
			"HOLIDAY_MANAGE", "WEEKLY_OFF_MANAGE",
			"EARN_LEAVE_GENERATE", "LEAVE_ENCASHMENT_APPROVE",
		};
		await AssignPermissionsToRoleAsync(db, roles, "HR",
			[
				"hr.employees.read", "hr.employees.write", "hr.dashboard.read",
				"attendance.read", "attendance.write", "attendance.reports.read",
				"company.read",
				.. hrLeavePermissions,
			],
			cancellationToken);
		await EnsurePermissionsForRoleAsync(db, roles, "HR", hrLeavePermissions, cancellationToken);
		await AssignPermissionsToRoleAsync(db, roles, "Management",
			[
				"hr.employees.read", "hr.dashboard.read",
				"attendance.read", "attendance.reports.read",
				"company.read",
				.. hrLeavePermissions,
			],
			cancellationToken);
		await EnsurePermissionsForRoleAsync(db, roles, "Management", hrLeavePermissions, cancellationToken);
		await AssignPermissionsToRoleAsync(db, roles, "HR Officer",
			[
				"hr.employees.read", "attendance.read", "attendance.reports.read",
				"leave.read", "LEAVE_APPLY", "LEAVE_BALANCE_VIEW", "company.read",
			],
			cancellationToken);
		await EnsurePermissionsForRoleAsync(db, roles, "HR Officer",
			["leave.read", "LEAVE_APPLY", "LEAVE_BALANCE_VIEW"],
			cancellationToken);
		await AssignPermissionsToRoleAsync(db, roles, "Accounts",
			["accounts.module.access", "accounts.read", "accounts.write", "company.read"],
			cancellationToken);
		await AssignPermissionsToRoleAsync(db, roles, "Accountant",
			["accounts.module.access", "accounts.read", "company.read"],
			cancellationToken);
		await AssignPermissionsToRoleAsync(db, roles, "IT Officer",
			["auth.users.read", "dataprocess.read", "dataprocess.write", "company.read"],
			cancellationToken);
		await AssignPermissionsToRoleAsync(db, roles, "User",
			["company.read", "hr.employees.read", "attendance.read", "leave.read"],
			cancellationToken);

		var adminPassword = Environment.GetEnvironmentVariable("ERP_SEED_SUPERADMIN_PASSWORD") ?? "ChangeMe!Erp2026";
		var admin = await users.FindByNameAsync("superadmin");
		if (admin is null)
		{
			admin = new AppUser
			{
				Id = Guid.NewGuid(),
				UserName = "superadmin",
				NormalizedUserName = "SUPERADMIN",
				Email = "admin@erp.local",
				NormalizedEmail = "ADMIN@ERP.LOCAL",
				EmailConfirmed = true,
				FullName = "Super Administrator",
				IsActive = true,
				Status = UserStatus.Active,
				LockoutEnabled = true,
				CreatedAt = BusinessTime.NowOffset,
			};
			var create = await users.CreateAsync(admin, adminPassword);
			if (!create.Succeeded)
			{
				logger.LogError("Failed to seed admin user: {Errors}", string.Join(", ", create.Errors.Select(e => e.Description)));
				return;
			}

			await users.AddToRoleAsync(admin, "SuperAdmin");
			logger.LogInformation("Seeded default admin user {Username}", "superadmin");
		}

		if (defaultCompanyGuid.HasValue && defaultCompanyGuid.Value != Guid.Empty)
		{
			await EnsureUserCompanyAccessAsync(db, admin!.Id, defaultCompanyGuid.Value, logger, cancellationToken);
		}
	}

	public static async Task EnsureUserCompanyAccessAsync(
		AuthDbContext db,
		Guid userId,
		Guid companyGuid,
		ILogger logger,
		CancellationToken cancellationToken = default)
	{
		if (await db.UserCompanyAccesses.AnyAsync(
			x => x.UserId == userId && x.CompanyGuid == companyGuid && !x.IsDeleted,
			cancellationToken))
		{
			return;
		}

		var existing = await db.UserCompanyAccesses
			.Where(x => x.UserId == userId && !x.IsDeleted)
			.ToListAsync(cancellationToken);

		foreach (var row in existing)
		{
			row.IsDefaultCompany = false;
		}

		db.UserCompanyAccesses.Add(new UserCompanyAccess
		{
			Id = Guid.NewGuid(),
			UserId = userId,
			CompanyGuid = companyGuid,
			IsDefaultCompany = existing.Count == 0,
			IsActive = true,
			CreatedAt = BusinessTime.NowOffset,
		});

		await db.SaveChangesAsync(cancellationToken);
		logger.LogInformation("Linked user {UserId} to company {CompanyGuid}", userId, companyGuid);
	}

	private static async Task AssignAllPermissionsToRoleAsync(AuthDbContext db, RoleManager<AppRole> roles, string roleName, CancellationToken cancellationToken)
	{
		var role = await roles.FindByNameAsync(roleName);
		if (role is null || await db.RolePermissions.AnyAsync(rp => rp.RoleId == role.Id, cancellationToken))
		{
			return;
		}

		var permissionIds = await db.Permissions.AsNoTracking().Select(p => p.Id).ToListAsync(cancellationToken);
		await ReplaceRolePermissionsAsync(db, role.Id, permissionIds, cancellationToken);
	}

	private static async Task AssignPermissionsToRoleAsync(
		AuthDbContext db,
		RoleManager<AppRole> roles,
		string roleName,
		IReadOnlyCollection<string> permissionCodes,
		CancellationToken cancellationToken)
	{
		var role = await roles.FindByNameAsync(roleName);
		if (role is null || await db.RolePermissions.AnyAsync(rp => rp.RoleId == role.Id, cancellationToken))
		{
			return;
		}

		var permissionIds = await db.Permissions.AsNoTracking()
			.Where(p => permissionCodes.Contains(p.Code))
			.Select(p => p.Id)
			.ToListAsync(cancellationToken);

		await ReplaceRolePermissionsAsync(db, role.Id, permissionIds, cancellationToken);
	}

	private static async Task EnsurePermissionsForRoleAsync(
		AuthDbContext db,
		RoleManager<AppRole> roles,
		string roleName,
		IReadOnlyCollection<string> permissionCodes,
		CancellationToken cancellationToken)
	{
		var role = await roles.FindByNameAsync(roleName);
		if (role is null)
		{
			return;
		}

		var existingCodes = await db.RolePermissions
			.Where(rp => rp.RoleId == role.Id)
			.Join(db.Permissions, rp => rp.PermissionId, p => p.Id, (_, p) => p.Code)
			.ToListAsync(cancellationToken);

		var missing = permissionCodes.Except(existingCodes).ToList();
		if (missing.Count == 0)
		{
			return;
		}

		var permissionIds = await db.Permissions.AsNoTracking()
			.Where(p => missing.Contains(p.Code))
			.Select(p => p.Id)
			.ToListAsync(cancellationToken);

		foreach (var pid in permissionIds)
		{
			db.RolePermissions.Add(new RolePermission
			{
				RoleId = role.Id,
				PermissionId = pid,
				CreatedAt = BusinessTime.NowOffset,
			});
		}

		await db.SaveChangesAsync(cancellationToken);
	}

	private static async Task ReplaceRolePermissionsAsync(
		AuthDbContext db,
		Guid roleId,
		IReadOnlyCollection<Guid> permissionIds,
		CancellationToken cancellationToken)
	{
		if (permissionIds.Count == 0)
		{
			return;
		}

		var existing = await db.RolePermissions.Where(rp => rp.RoleId == roleId).ToListAsync(cancellationToken);
		if (existing.Count > 0)
		{
			db.RolePermissions.RemoveRange(existing);
		}

		foreach (var pid in permissionIds)
		{
			db.RolePermissions.Add(new RolePermission
			{
				RoleId = roleId,
				PermissionId = pid,
				CreatedAt = BusinessTime.NowOffset,
			});
		}

		await db.SaveChangesAsync(cancellationToken);
	}
}
