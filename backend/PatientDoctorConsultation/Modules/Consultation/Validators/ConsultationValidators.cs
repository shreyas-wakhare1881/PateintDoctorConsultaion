using FluentValidation;
using PatientDoctorConsultation.Modules.Consultation.DTOs;
using PatientDoctorConsultation.Modules.Consultation.Enums;

namespace PatientDoctorConsultation.Modules.Consultation.Validators;

// ════════════════════════════════════════════════════════════════════════════
// BOOK CONSULTATION
// ════════════════════════════════════════════════════════════════════════════

public class BookConsultationRequestValidator : AbstractValidator<BookConsultationRequest>
{
    public BookConsultationRequestValidator()
    {
        RuleFor(x => x.DoctorId)
            .NotEmpty().WithMessage("DoctorId is required.");

        RuleFor(x => x.ScheduledDate)
            .NotEmpty().WithMessage("ScheduledDate is required.")
            .GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow.Date))
            .WithMessage("ScheduledDate must be today or a future date.");

        RuleFor(x => x.StartTime)
            .NotEmpty().WithMessage("StartTime is required.")
            .Must(BeValidTimeFormat).WithMessage("StartTime must be in HH:mm:ss format.");

        RuleFor(x => x.EndTime)
            .NotEmpty().WithMessage("EndTime is required.")
            .Must(BeValidTimeFormat).WithMessage("EndTime must be in HH:mm:ss format.");

        RuleFor(x => x)
            .Must(x => !BeValidTimeFormat(x.StartTime) || !BeValidTimeFormat(x.EndTime) ||
                       TimeOnly.Parse(x.StartTime) < TimeOnly.Parse(x.EndTime))
            .WithMessage("StartTime must be before EndTime.")
            .OverridePropertyName("StartTime");

        RuleFor(x => x.TimeZone)
            .NotEmpty().WithMessage("TimeZone is required.")
            .MaximumLength(100).WithMessage("TimeZone must not exceed 100 characters.");

        RuleFor(x => x.ConsultationType)
            .NotEmpty().WithMessage("ConsultationType is required.")
            .Must(t => Enum.TryParse<ConsultationType>(t, out _))
            .WithMessage("ConsultationType must be 'Video' or 'InPerson'.");

        RuleFor(x => x.Symptoms)
            .NotEmpty().WithMessage("Symptoms are required.")
            .MinimumLength(10).WithMessage("Symptoms must be at least 10 characters.")
            .MaximumLength(2000).WithMessage("Symptoms must not exceed 2000 characters.");

        RuleFor(x => x.ParentConsultationId)
            .NotNull().WithMessage("ParentConsultationId is required when IsFollowUp is true.")
            .When(x => x.IsFollowUp);
    }

    private static bool BeValidTimeFormat(string? time)
        => time is not null && TimeOnly.TryParse(time, out _);
}

// ════════════════════════════════════════════════════════════════════════════
// CANCEL CONSULTATION
// ════════════════════════════════════════════════════════════════════════════

public class CancelConsultationRequestValidator : AbstractValidator<CancelConsultationRequest>
{
    public CancelConsultationRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Cancellation reason is required.")
            .MinimumLength(10).WithMessage("Cancellation reason must be at least 10 characters.")
            .MaximumLength(500).WithMessage("Cancellation reason must not exceed 500 characters.");
    }
}

// ════════════════════════════════════════════════════════════════════════════
// REJECT CONSULTATION
// ════════════════════════════════════════════════════════════════════════════

public class RejectConsultationRequestValidator : AbstractValidator<RejectConsultationRequest>
{
    public RejectConsultationRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Rejection reason is required.")
            .MinimumLength(10).WithMessage("Rejection reason must be at least 10 characters.")
            .MaximumLength(500).WithMessage("Rejection reason must not exceed 500 characters.");
    }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPLETE CONSULTATION
// ════════════════════════════════════════════════════════════════════════════

public class CompleteConsultationRequestValidator : AbstractValidator<CompleteConsultationRequest>
{
    public CompleteConsultationRequestValidator()
    {
        RuleFor(x => x.Notes)
            .MaximumLength(5000).WithMessage("Notes must not exceed 5000 characters.")
            .When(x => x.Notes is not null);
    }
}
