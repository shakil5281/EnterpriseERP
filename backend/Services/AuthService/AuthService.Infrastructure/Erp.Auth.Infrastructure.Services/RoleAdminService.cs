using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Application.Abstractions.Roles;
using AuthService.Contracts.Roles;
using AuthService.Infrastructure.Entities;
using AuthService.Infrastructure.Identity;
using AuthService.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Infrastructure.Services;

public sealed class RoleAdminService(AuthDbContext db, RoleManager<AppRole> roleManager) : IRoleAdminService
{
	public async Task<(IReadOnlyList<RoleDto>? Items, IReadOnlyList<string> Errors)> ListRolesAsync(CancellationToken cancellationToken = default)
	{
		List<RoleDto> list = await (from r in db.Roles.AsNoTracking()
			where !r.IsDeleted && r.Name != null
			orderby r.Name
			select new RoleDto
			{
				Id = r.Id,
				Name = r.Name!
			}).ToListAsync(cancellationToken);
		return (list, Array.Empty<string>());
	}

	public async Task<(RoleDto? Role, IReadOnlyList<string> Errors)> CreateRoleAsync(RoleCreateRequest request, CancellationToken cancellationToken = default)
	{
		string name = request.Name.Trim();
		if (name.Length == 0)
		{
			return (Role: null, Errors: new string[1] { "Role name is required." });
		}
		if (await roleManager.RoleExistsAsync(name))
		{
			return (Role: null, Errors: new string[1] { "Role already exists." });
		}
		AppRole role = new AppRole
		{
			Id = Guid.NewGuid(),
			Name = name,
			NormalizedName = name.ToUpperInvariant(),
			CreatedAt = DateTimeOffset.UtcNow
		};
		IdentityResult result = await roleManager.CreateAsync(role);
		if (!result.Succeeded)
		{
			return (Role: null, Errors: result.Errors.Select((IdentityError e) => e.Description).ToList());
		}
		return (new RoleDto
		{
			Id = role.Id,
			Name = name
		}, Array.Empty<string>());
	}

	public async Task<(bool Ok, IReadOnlyList<string> Errors)> AssignPermissionsAsync(Guid roleId, AssignRolePermissionsRequest request, CancellationToken cancellationToken = default)
	{
		AppRole? role = await roleManager.FindByIdAsync(roleId.ToString());
		if (role == null || role.IsDeleted)
		{
			return (Ok: false, Errors: new string[1] { "Role not found." });
		}
		List<string> codes = request.PermissionCodes.Select((string c) => c.Trim()).Where((string c) => c.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
		List<Guid> permissionIds = await (from p in db.Permissions
			where codes.Contains(p.Code) && !p.IsDeleted
			select p.Id).ToListAsync(cancellationToken);
		if (permissionIds.Count != codes.Count)
		{
			return (Ok: false, Errors: new string[1] { "One or more permission codes are invalid." });
		}
		List<RolePermission> existing = await db.RolePermissions.Where((RolePermission x) => x.RoleId == roleId).ToListAsync(cancellationToken);
		db.RolePermissions.RemoveRange(existing);
		DateTimeOffset now = DateTimeOffset.UtcNow;
		foreach (Guid pid in permissionIds)
		{
			db.RolePermissions.Add(new RolePermission
			{
				RoleId = roleId,
				PermissionId = pid,
				CreatedAt = now
			});
		}
		await db.SaveChangesAsync(cancellationToken);
		return (Ok: true, Errors: Array.Empty<string>());
	}
}
