using FluentValidation;
using PatientDoctorConsultation.Modules.Doctor.DTOs;

namespace PatientDoctorConsultation.Modules.Doctor.Validators;

public class UpdateDoctorProfileRequestValidator : AbstractValidator<UpdateDoctorProfileRequest>
{
    public UpdateDoctorProfileRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Specialization).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PhoneNumber).MaximumLength(20).When(x => x.PhoneNumber is not null);
        RuleFor(x => x.Bio).MaximumLength(1000).When(x => x.Bio is not null);
        RuleFor(x => x.ConsultationFee).GreaterThanOrEqualTo(0);
    }
}
