using FluentValidation;
using PatientDoctorConsultation.Modules.Consultation.DTOs;

namespace PatientDoctorConsultation.Modules.Consultation.Validators;

public class BookConsultationRequestValidator : AbstractValidator<BookConsultationRequest>
{
    public BookConsultationRequestValidator()
    {
        RuleFor(x => x.DoctorId).NotEmpty();
        RuleFor(x => x.ScheduledAt).GreaterThan(DateTime.UtcNow)
            .WithMessage("Scheduled time must be in the future.");
        RuleFor(x => x.Symptoms).MaximumLength(1000).When(x => x.Symptoms is not null);
    }
}

public class ConsultationSummaryRequestValidator : AbstractValidator<ConsultationSummaryRequest>
{
    public ConsultationSummaryRequestValidator()
    {
        RuleFor(x => x.ConsultationId).NotEmpty();
        RuleFor(x => x.TranscriptText).NotEmpty().MaximumLength(50_000);
    }
}
