using System;

namespace AuthService.Contracts.CompanyAccess;

public sealed class UserCompanyAccessDto
{
	public Guid Id { get; init; }

	public int CompanyId { get; init; }

	public bool IsDefaultCompany { get; init; }
}
