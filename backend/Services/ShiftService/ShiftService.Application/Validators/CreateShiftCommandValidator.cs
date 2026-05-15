using FluentValidation;
using ShiftService.Application.Features.Shifts.Commands;

namespace ShiftService.Application.Validators;

public class CreateShiftCommandValidator : AbstractValidator<CreateShiftCommand>
{
    public CreateShiftCommandValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.ShiftCode).NotEmpty().MaximumLength(50);
        RuleFor(x => x.ShiftName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.ShiftType).NotEmpty();
        RuleFor(x => x.StartTime).NotEmpty();
        RuleFor(x => x.EndTime).NotEmpty();
        
        RuleFor(x => x)
            .Must(x => x.IsCrossDay || x.EndTime > x.StartTime)
            .WithMessage("If EndTime is smaller than StartTime, IsCrossDay must be true.");
    }
}
