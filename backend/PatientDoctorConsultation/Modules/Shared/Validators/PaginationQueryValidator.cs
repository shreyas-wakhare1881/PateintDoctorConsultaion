using FluentValidation;
using PatientDoctorConsultation.Modules.Shared.DTOs;

namespace PatientDoctorConsultation.Modules.Shared.Validators;

public class PaginationQueryValidator : AbstractValidator<PaginationQuery>
{
    public PaginationQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}
