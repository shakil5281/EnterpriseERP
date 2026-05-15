using AuthService.Contracts.CompanyAccess;
using FluentValidation;

namespace AuthService.Application.Validators;

public sealed class SetUserCompanyAccessRequestValidator : AbstractValidator<SetUserCompanyAccessRequest>
{
	public SetUserCompanyAccessRequestValidator()
	{
		RuleFor(x => x.Items).NotNull().NotEmpty();
		RuleForEach(x => x.Items).ChildRules(item =>
		{
			item.RuleFor(i => i.CompanyId).GreaterThan(0);
		});
	}
}
