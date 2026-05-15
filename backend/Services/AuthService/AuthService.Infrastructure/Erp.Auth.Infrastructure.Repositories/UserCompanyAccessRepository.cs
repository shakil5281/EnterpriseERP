using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AuthService.Application.Abstractions.CompanyAccess;
using AuthService.Application.Models;
using AuthService.Infrastructure.Entities;
using AuthService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace AuthService.Infrastructure.Repositories;

public sealed class UserCompanyAccessRepository(AuthDbContext db) : IUserCompanyAccessRepository
{
	public async Task<IReadOnlyList<UserCompanyAccessRecord>> ListActiveByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
	{
		return await (from x in db.UserCompanyAccesses.AsNoTracking()
			where x.UserId == userId && !x.IsDeleted && x.IsActive
			orderby x.IsDefaultCompany descending, x.CompanyId
			select new UserCompanyAccessRecord(x.Id, x.CompanyId, x.IsDefaultCompany)).ToListAsync(cancellationToken);
	}

	public async Task ReplaceAssignmentsAsync(Guid userId, IReadOnlyList<(int CompanyId, bool IsDefaultCompany)> items, Guid? actorUserId, CancellationToken cancellationToken = default)
	{
		await using IDbContextTransaction tx = await db.Database.BeginTransactionAsync(cancellationToken);
		DateTimeOffset now = DateTimeOffset.UtcNow;
		foreach (UserCompanyAccess row in await db.UserCompanyAccesses.Where(x => x.UserId == userId && !x.IsDeleted).ToListAsync(cancellationToken))
		{
			row.IsDeleted = true;
			row.DeletedAt = now;
			row.DeletedBy = actorUserId;
			row.UpdatedAt = now;
			row.UpdatedBy = actorUserId;
		}
		bool defaultApplied = false;
		foreach (var item in items)
		{
			int companyId = item.CompanyId;
			bool isDefault = item.IsDefaultCompany && !defaultApplied;
			if (isDefault)
			{
				defaultApplied = true;
			}
			db.UserCompanyAccesses.Add(new UserCompanyAccess
			{
				Id = Guid.NewGuid(),
				UserId = userId,
				CompanyId = companyId,
				IsDefaultCompany = isDefault,
				IsActive = true,
				CreatedAt = now,
				CreatedBy = actorUserId
			});
		}
		await db.SaveChangesAsync(cancellationToken);
		await tx.CommitAsync(cancellationToken);
	}
}
