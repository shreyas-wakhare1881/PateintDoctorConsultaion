using FluentValidation;
using PatientDoctorConsultation.Modules.Admin.DTOs;

namespace PatientDoctorConsultation.Modules.Admin.Validators;

public class DoctorVerificationRequestValidator : AbstractValidator<DoctorVerificationRequest>
{
    public DoctorVerificationRequestValidator()
    {
        RuleFor(x => x.DoctorId).NotEmpty();
        RuleFor(x => x.Remarks).MaximumLength(500).When(x => x.Remarks is not null);
    }
}
