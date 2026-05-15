using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Application.Abstractions.Users;
using AuthService.Contracts.Common;
using AuthService.Contracts.Users;
using AuthService.Infrastructure.Entities;
using AuthService.Infrastructure.Identity;
using AuthService.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Infrastructure.Services;

public sealed class UserAdminService(AuthDbContext db, UserManager<AppUser> userManager) : IUserAdminService
{
	public async Task<(IReadOnlyList<UserListItemDto>? Items, IReadOnlyList<string> Errors)> ListUsersAsync(CancellationToken cancellationToken = default)
	{
		DateTimeOffset now = DateTimeOffset.UtcNow;
		List<UserListItemDto> list = await (from u in db.Users.AsNoTracking()
			where !u.IsDeleted
			orderby u.UserName
			select new UserListItemDto
			{
				Id = u.Id,
				FullName = u.FullName,
				UserName = (u.UserName ?? string.Empty),
				Email = (u.Email ?? string.Empty),
				PhoneNumber = u.PhoneNumber,
				Status = u.Status,
				IsActive = u.IsActive,
				IsLocked = u.LockoutEnd.HasValue && u.LockoutEnd > now,
				LastLoginAt = u.LastLoginAt
			}).ToListAsync(cancellationToken);
		return (list, Array.Empty<string>());
	}

	public async Task<(bool Ok, IReadOnlyList<string> Errors)> UpdateStatusAsync(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken = default)
	{
		AppUser? user = await userManager.FindByIdAsync(userId.ToString());
		if (user == null || user.IsDeleted)
		{
			return (Ok: false, Errors: new string[1] { "User not found." });
		}
		user.Status = request.Status;
		user.IsActive = request.IsActive;
		user.UpdatedAt = DateTimeOffset.UtcNow;
		IdentityResult result = await userManager.UpdateAsync(user);
		if (!result.Succeeded)
		{
			return (Ok: false, Errors: result.Errors.Select((IdentityError e) => e.Description).ToList());
		}
		return (Ok: true, Errors: Array.Empty<string>());
	}

	public async Task<(bool Ok, IReadOnlyList<string> Errors)> AssignRolesAsync(Guid userId, AssignUserRolesRequest request, CancellationToken cancellationToken = default)
	{
		AppUser? user = await userManager.FindByIdAsync(userId.ToString());
		if (user == null || user.IsDeleted)
		{
			return (Ok: false, Errors: new string[1] { "User not found." });
		}
		List<string> desired = request.RoleNames.Select((string n) => n.Trim()).Where((string n) => n.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
		foreach (string roleName in desired)
		{
			if (!await db.Roles.AnyAsync((AppRole r) => r.Name == roleName && !r.IsDeleted, cancellationToken))
			{
				return (Ok: false, Errors: new string[1] { "Unknown role: " + roleName });
			}
		}
		IList<string> current = await userManager.GetRolesAsync(user);
		await userManager.RemoveFromRolesAsync(user, current);
		if (desired.Count > 0)
		{
			IdentityResult add = await userManager.AddToRolesAsync(user, desired);
			if (!add.Succeeded)
			{
				return (Ok: false, Errors: add.Errors.Select((IdentityError e) => e.Description).ToList());
			}
		}
		return (Ok: true, Errors: Array.Empty<string>());
	}

	public async Task<(IReadOnlyList<UserLoginHistoryDto>? Items, IReadOnlyList<string> Errors)> GetLoginHistoryAsync(Guid userId, CancellationToken cancellationToken = default)
	{
		if ((await userManager.FindByIdAsync(userId.ToString()))?.IsDeleted ?? true)
		{
			return (Items: null, Errors: new string[1] { "User not found." });
		}
		List<UserLoginHistoryDto> rows = await (from h in db.UserLoginHistories.AsNoTracking()
			where h.UserId == userId
			orderby h.LoginAt descending
			select new UserLoginHistoryDto
			{
				Id = h.Id,
				IpAddress = h.IpAddress,
				MacAddress = h.MacAddress,
				DeviceName = h.DeviceName,
				Browser = h.Browser,
				OperatingSystem = h.OperatingSystem,
				IsSuccess = h.IsSuccess,
				FailureReason = h.FailureReason,
				LoginAt = h.LoginAt
			}).Take(500).ToListAsync(cancellationToken);
		return (rows, Array.Empty<string>());
	}
}
