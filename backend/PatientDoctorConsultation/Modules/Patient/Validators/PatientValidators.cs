using FluentValidation;
using PatientDoctorConsultation.Modules.Patient.DTOs;

namespace PatientDoctorConsultation.Modules.Patient.Validators;

public class UpdatePatientProfileRequestValidator : AbstractValidator<UpdatePatientProfileRequest>
{
    public UpdatePatientProfileRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PhoneNumber).MaximumLength(20).When(x => x.PhoneNumber is not null);
        RuleFor(x => x.Gender).MaximumLength(20).When(x => x.Gender is not null);
        RuleFor(x => x.BloodGroup).MaximumLength(5).When(x => x.BloodGroup is not null);
    }
}
