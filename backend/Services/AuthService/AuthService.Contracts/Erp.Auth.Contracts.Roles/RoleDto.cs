using System;

namespace AuthService.Contracts.Roles;

public sealed class RoleDto
{
	public Guid Id { get; init; }

	public string Name { get; init; } = string.Empty;
}
