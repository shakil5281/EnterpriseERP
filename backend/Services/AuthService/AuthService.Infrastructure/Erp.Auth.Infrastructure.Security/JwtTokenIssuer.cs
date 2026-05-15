using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AuthService.Infrastructure.Identity;
using AuthService.Infrastructure.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace AuthService.Infrastructure.Security;

public sealed class JwtTokenIssuer(IOptions<JwtOptions> options) : IJwtTokenIssuer
{
	private readonly JwtOptions _options = options.Value;

	public (string Token, DateTime ExpiresAtUtc) CreateAccessToken(AppUser user, IReadOnlyList<string> roles, IReadOnlyList<string> permissions)
	{
		//IL_01a8: Unknown result type (might be due to invalid IL or missing references)
		//IL_01ae: Expected O, but got Unknown
		//IL_01b4: Unknown result type (might be due to invalid IL or missing references)
		//IL_01ba: Expected O, but got Unknown
		//IL_01f4: Unknown result type (might be due to invalid IL or missing references)
		//IL_01fb: Expected O, but got Unknown
		//IL_01fb: Unknown result type (might be due to invalid IL or missing references)
		//IL_0202: Expected O, but got Unknown
		if (string.IsNullOrWhiteSpace(_options.SigningKey) || _options.SigningKey.Length < 32)
		{
			throw new InvalidOperationException("Jwt:SigningKey must be configured and at least 32 characters.");
		}
		DateTime dateTime = DateTime.UtcNow.AddMinutes((_options.AccessTokenMinutes <= 0) ? 15 : _options.AccessTokenMinutes);
		List<Claim> list = new List<Claim>
		{
			new Claim("sub", user.Id.ToString()),
			new Claim("unique_name", user.UserName ?? string.Empty),
			new Claim("email", user.Email ?? string.Empty),
			new Claim("jti", Guid.NewGuid().ToString()),
			new Claim("full_name", user.FullName)
		};
		foreach (string role in roles)
		{
			list.Add(new Claim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", role));
		}
		foreach (string permission in permissions)
		{
			list.Add(new Claim("permission", permission));
		}
		SymmetricSecurityKey val = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
		SigningCredentials val2 = new SigningCredentials((SecurityKey)(object)val, "HS256");
		JwtSecurityToken val3 = new JwtSecurityToken(_options.Issuer, _options.Audience, (IEnumerable<Claim>)list, (DateTime?)DateTime.UtcNow.AddSeconds(-30.0), (DateTime?)dateTime, val2);
		JwtSecurityTokenHandler val4 = new JwtSecurityTokenHandler();
		return (Token: ((SecurityTokenHandler)val4).WriteToken((SecurityToken)(object)val3), ExpiresAtUtc: dateTime);
	}

	public static string HashRefreshToken(string rawToken)
	{
		byte[] inArray = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
		return Convert.ToHexString(inArray);
	}

	public static string CreateRawRefreshToken()
	{
		byte[] array = new byte[64];
		RandomNumberGenerator.Fill(array);
		return Convert.ToBase64String(array);
	}
}
