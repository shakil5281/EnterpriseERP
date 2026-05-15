using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Application.Abstractions.CompanyAccess;
using AuthService.Application.Models;
using AuthService.Contracts.CompanyAccess;
using AuthService.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

namespace AuthService.Infrastructure.Services;

public sealed class CompanyAccessAdminService(IUserCompanyAccessRepository repository, UserManager<AppUser> userManager) : ICompanyAccessAdminService
{
	public async Task<(IReadOnlyList<UserCompanyAccessDto>? Data, IReadOnlyList<string> Errors)> GetForUserAsync(Guid targetUserId, CancellationToken cancellationToken = default)
	{
		AppUser? user = await userManager.FindByIdAsync(targetUserId.ToString());
		if (user is null || user.IsDeleted)
		{
			return (Data: null, Errors: new[] { "User not found." });
		}
		List<UserCompanyAccessDto> dto = (await repository.ListActiveByUserIdAsync(targetUserId, cancellationToken))
			.Select(r => new UserCompanyAccessDto
			{
				Id = r.Id,
				CompanyId = r.CompanyId,
				IsDefaultCompany = r.IsDefaultCompany,
			})
			.ToList();
		return (Data: dto, Errors: Array.Empty<string>());
	}

	public async Task<(IReadOnlyList<UserCompanyAccessDto>? Data, IReadOnlyList<string> Errors)> SetForUserAsync(Guid targetUserId, SetUserCompanyAccessRequest request, Guid actorUserId, CancellationToken cancellationToken = default)
	{
		AppUser? user = await userManager.FindByIdAsync(targetUserId.ToString());
		if (user is null || user.IsDeleted)
		{
			return (Data: null, Errors: new[] { "User not found." });
		}
		List<(int CompanyId, bool IsDefaultCompany)> pairs = request.Items
			.Select(x => (CompanyId: x.CompanyId, IsDefaultCompany: x.IsDefaultCompany))
			.ToList();
		if (pairs.Select(p => p.CompanyId).Distinct().Count() != pairs.Count)
		{
			return (Data: null, Errors: new[] { "Duplicate company assignments are not allowed." });
		}
		await repository.ReplaceAssignmentsAsync(targetUserId, pairs, actorUserId, cancellationToken);
		return await GetForUserAsync(targetUserId, cancellationToken);
	}
}
