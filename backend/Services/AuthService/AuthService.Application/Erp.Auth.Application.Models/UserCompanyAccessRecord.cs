using System;

namespace AuthService.Application.Models;

public sealed record UserCompanyAccessRecord(Guid Id, int CompanyId, bool IsDefaultCompany);
