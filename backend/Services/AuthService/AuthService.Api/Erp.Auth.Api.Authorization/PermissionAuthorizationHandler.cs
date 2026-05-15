using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace AuthService.Api.Authorization;

public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
	protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
	{
		if (context.User.Claims.Any((Claim c) => c.Type == "permission" && c.Value == requirement.Permission))
		{
			context.Succeed(requirement);
		}
		return Task.CompletedTask;
	}
}
