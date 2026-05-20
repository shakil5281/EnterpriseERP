using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Contracts.Common;
using AuthService.Infrastructure.Entities;
using AuthService.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AuthService.Infrastructure.Persistence;

public static class AuthDataSeeder
{
	public static async Task SeedAsync(AuthDbContext db, UserManager<AppUser> users, RoleManager<AppRole> roles, ILogger logger, CancellationToken cancellationToken = default(CancellationToken))
	{
		await db.Database.MigrateAsync(cancellationToken);
		(string, string)[] permissionSeeds = new(string, string)[7]
		{
			("auth.users.read", "View users"),
			("auth.users.write", "Manage users"),
			("auth.roles.read", "View roles"),
			("auth.roles.write", "Manage roles"),
			("auth.permissions.read", "View permission catalog"),
			("hr.employees.read", "View employees"),
			("hr.employees.write", "Manage employees")
		};
		(string, string)[] array = permissionSeeds;
		for (int i = 0; i < array.Length; i++)
		{
			var (code, description) = array[i];
			if (!(await db.Permissions.AnyAsync((Permission p) => p.Code == code && !p.IsDeleted, cancellationToken)))
			{
				db.Permissions.Add(new Permission
				{
					Id = Guid.NewGuid(),
					Code = code,
					Description = description,
					CreatedAt = DateTimeOffset.UtcNow
				});
			}
		}
		await db.SaveChangesAsync(cancellationToken);
		string[] roleSeeds = new string[17]
		{
			"SuperAdmin", "Admin", "User", "HR", "Management", "HR Officer", "IT Officer", "Accounts", "Accountant", "Account Officer",
			"Production", "ProductionManager", "Store", "StoreKeeper", "Cutting", "Merchandising", "Merchandiser"
		};
		string[] array2 = roleSeeds;
		foreach (string roleName in array2)
		{
			if (await roles.RoleExistsAsync(roleName))
			{
				continue;
			}
			AppRole role = new AppRole
			{
				Id = Guid.NewGuid(),
				Name = roleName,
				NormalizedName = roleName.ToUpperInvariant(),
				CreatedAt = DateTimeOffset.UtcNow
			};
			IdentityResult result = await roles.CreateAsync(role);
			if (!result.Succeeded)
			{
				logger.LogError("Failed to create role {Role}: {Errors}", roleName, string.Join(", ", result.Errors.Select((IdentityError e) => e.Description)));
			}
		}
		await AssignAllPermissionsToRoleAsync(db, roles, "SuperAdmin", cancellationToken);
		await AssignPermissionsToRoleAsync(db, roles, "Admin", new string[6] { "auth.users.read", "auth.users.write", "auth.roles.read", "auth.roles.write", "hr.employees.read", "hr.employees.write" }, cancellationToken);
		if (await users.FindByNameAsync("superadmin") != null)
		{
			return;
		}
		AppUser admin = new AppUser
		{
			Id = Guid.NewGuid(),
			UserName = "superadmin",
			NormalizedUserName = "superadmin".ToUpperInvariant(),
			Email = "admin@erp.local",
			NormalizedEmail = "ADMIN@ERP.LOCAL",
			EmailConfirmed = true,
			FullName = "Super Administrator",
			IsActive = true,
			Status = UserStatus.Active,
			LockoutEnabled = true,
			CreatedAt = DateTimeOffset.UtcNow
		};
		IdentityResult create = await users.CreateAsync(admin, "shakil52814542A@");
		if (!create.Succeeded)
		{
			logger.LogError("Failed to seed admin user: {Errors}", string.Join(", ", create.Errors.Select((IdentityError e) => e.Description)));
			return;
		}
		await users.AddToRoleAsync(admin, "SuperAdmin");
		logger.LogInformation("Seeded default admin user {Username}", "superadmin");
		if (!(await db.UserCompanyAccesses.AnyAsync((UserCompanyAccess x) => x.UserId == admin.Id && !x.IsDeleted, cancellationToken)))
		{
			db.UserCompanyAccesses.Add(new UserCompanyAccess
			{
				Id = Guid.NewGuid(),
				UserId = admin.Id,
				CompanyId = 1,
				IsDefaultCompany = true,
				IsActive = true,
				CreatedAt = DateTimeOffset.UtcNow
			});
			await db.SaveChangesAsync(cancellationToken);
			logger.LogInformation("Seeded default company access CompanyId=1 for {Username}", "superadmin");
		}
	}

	private static async Task AssignAllPermissionsToRoleAsync(AuthDbContext db, RoleManager<AppRole> roles, string roleName, CancellationToken cancellationToken)
	{
		AppRole? role = await roles.FindByNameAsync(roleName);
		if (role != null && !(await db.RolePermissions.AnyAsync((RolePermission rp) => rp.RoleId == role.Id, cancellationToken)))
		{
			await ReplaceRolePermissionsAsync(permissionIds: await (from p in db.Permissions.AsNoTracking()
				select p.Id).ToListAsync(cancellationToken), db: db, roleId: role.Id, cancellationToken: cancellationToken);
		}
	}

	private static async Task AssignPermissionsToRoleAsync(AuthDbContext db, RoleManager<AppRole> roles, string roleName, IReadOnlyCollection<string> permissionCodes, CancellationToken cancellationToken)
	{
		AppRole? role = await roles.FindByNameAsync(roleName);
		if (role != null && !(await db.RolePermissions.AnyAsync((RolePermission rp) => rp.RoleId == role.Id, cancellationToken)))
		{
			await ReplaceRolePermissionsAsync(permissionIds: await (from p in db.Permissions.AsNoTracking()
				where permissionCodes.Contains(p.Code)
				select p.Id).ToListAsync(cancellationToken), db: db, roleId: role.Id, cancellationToken: cancellationToken);
		}
	}

	private static async Task ReplaceRolePermissionsAsync(AuthDbContext db, Guid roleId, IReadOnlyCollection<Guid> permissionIds, CancellationToken cancellationToken)
	{
		if (permissionIds.Count == 0)
		{
			return;
		}
		List<RolePermission> existing = await db.RolePermissions.Where((RolePermission rp) => rp.RoleId == roleId).ToListAsync(cancellationToken);
		if (existing.Count > 0)
		{
			db.RolePermissions.RemoveRange(existing);
		}
		foreach (Guid pid in permissionIds)
		{
			db.RolePermissions.Add(new RolePermission
			{
				RoleId = roleId,
				PermissionId = pid,
				CreatedAt = DateTimeOffset.UtcNow
			});
		}
		await db.SaveChangesAsync(cancellationToken);
	}
}
