namespace AuthService.Contracts.CompanyAccess;

public sealed class UserCompanyAccessItemDto
{
	public int CompanyId { get; init; }

	public bool IsDefaultCompany { get; init; }
}
