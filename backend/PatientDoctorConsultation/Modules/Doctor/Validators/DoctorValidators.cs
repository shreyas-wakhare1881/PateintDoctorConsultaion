using FluentValidation;
using PatientDoctorConsultation.Modules.Doctor.DTOs;

namespace PatientDoctorConsultation.Modules.Doctor.Validators;

// ════════════════════════════════════════════════════════════════════════════
// CREATE PROFILE
// ════════════════════════════════════════════════════════════════════════════

public class CreateDoctorProfileRequestValidator : AbstractValidator<CreateDoctorProfileRequest>
{
    public CreateDoctorProfileRequestValidator()
    {
        RuleFor(x => x.Specialization)
            .NotEmpty().WithMessage("Specialization is required.")
            .MaximumLength(256).WithMessage("Specialization must not exceed 256 characters.");

        RuleFor(x => x.Qualification)
            .NotEmpty().WithMessage("Qualification is required.")
            .MaximumLength(512).WithMessage("Qualification must not exceed 512 characters.");

        RuleFor(x => x.ExperienceYears)
            .GreaterThanOrEqualTo(0).WithMessage("Experience years cannot be negative.")
            .LessThanOrEqualTo(80).WithMessage("Experience years exceeds realistic maximum.");

        RuleFor(x => x.LicenseNumber)
            .NotEmpty().WithMessage("License number is required.")
            .MaximumLength(100).WithMessage("License number must not exceed 100 characters.")
            .Matches(@"^[A-Za-z0-9\-/]+$").WithMessage("License number contains invalid characters.");

        RuleFor(x => x.Bio)
            .MaximumLength(1000).WithMessage("Bio must not exceed 1000 characters.")
            .When(x => x.Bio is not null);

        RuleFor(x => x.ConsultationFee)
            .GreaterThanOrEqualTo(0m).WithMessage("Consultation fee cannot be negative.")
            .LessThanOrEqualTo(99_999.99m).WithMessage("Consultation fee exceeds the maximum allowed value.");

        RuleFor(x => x.HospitalName)
            .MaximumLength(256).WithMessage("Hospital name must not exceed 256 characters.")
            .When(x => x.HospitalName is not null);

        RuleFor(x => x.ClinicAddress)
            .MaximumLength(512).WithMessage("Clinic address must not exceed 512 characters.")
            .When(x => x.ClinicAddress is not null);

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required.")
            .MaximumLength(100).WithMessage("City must not exceed 100 characters.");

        RuleFor(x => x.State)
            .MaximumLength(100).WithMessage("State must not exceed 100 characters.")
            .When(x => x.State is not null);

        RuleFor(x => x.Country)
            .MaximumLength(100).WithMessage("Country must not exceed 100 characters.")
            .When(x => x.Country is not null);

        RuleFor(x => x.LanguagesSpoken)
            .Must(l => l is null || l.Count <= 20)
            .WithMessage("Languages spoken list must not exceed 20 entries.")
            .Must(l => l is null || l.All(lang => !string.IsNullOrWhiteSpace(lang) && lang.Length <= 50))
            .WithMessage("Each language must be a non-empty string not exceeding 50 characters.")
            .When(x => x.LanguagesSpoken is not null);
    }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE PROFILE
// ════════════════════════════════════════════════════════════════════════════

public class UpdateDoctorProfileRequestValidator : AbstractValidator<UpdateDoctorProfileRequest>
{
    public UpdateDoctorProfileRequestValidator()
    {
        RuleFor(x => x.Specialization)
            .MaximumLength(256).WithMessage("Specialization must not exceed 256 characters.")
            .When(x => x.Specialization is not null);

        RuleFor(x => x.Qualification)
            .MaximumLength(512).WithMessage("Qualification must not exceed 512 characters.")
            .When(x => x.Qualification is not null);

        RuleFor(x => x.ExperienceYears)
            .GreaterThanOrEqualTo(0).WithMessage("Experience years cannot be negative.")
            .LessThanOrEqualTo(80).WithMessage("Experience years exceeds realistic maximum.")
            .When(x => x.ExperienceYears.HasValue);

        RuleFor(x => x.LicenseNumber)
            .MaximumLength(100).WithMessage("License number must not exceed 100 characters.")
            .Matches(@"^[A-Za-z0-9\-/]+$").WithMessage("License number contains invalid characters.")
            .When(x => x.LicenseNumber is not null);

        RuleFor(x => x.Bio)
            .MaximumLength(1000).WithMessage("Bio must not exceed 1000 characters.")
            .When(x => x.Bio is not null);

        RuleFor(x => x.ConsultationFee)
            .GreaterThanOrEqualTo(0m).WithMessage("Consultation fee cannot be negative.")
            .LessThanOrEqualTo(99_999.99m).WithMessage("Consultation fee exceeds the maximum allowed value.")
            .When(x => x.ConsultationFee.HasValue);

        RuleFor(x => x.HospitalName)
            .MaximumLength(256).WithMessage("Hospital name must not exceed 256 characters.")
            .When(x => x.HospitalName is not null);

        RuleFor(x => x.ClinicAddress)
            .MaximumLength(512).WithMessage("Clinic address must not exceed 512 characters.")
            .When(x => x.ClinicAddress is not null);

        RuleFor(x => x.City)
            .MaximumLength(100).WithMessage("City must not exceed 100 characters.")
            .When(x => x.City is not null);

        RuleFor(x => x.State)
            .MaximumLength(100).WithMessage("State must not exceed 100 characters.")
            .When(x => x.State is not null);

        RuleFor(x => x.Country)
            .MaximumLength(100).WithMessage("Country must not exceed 100 characters.")
            .When(x => x.Country is not null);

        RuleFor(x => x.LanguagesSpoken)
            .Must(l => l is null || l.Count <= 20)
            .WithMessage("Languages spoken list must not exceed 20 entries.")
            .Must(l => l is null || l.All(lang => !string.IsNullOrWhiteSpace(lang) && lang.Length <= 50))
            .WithMessage("Each language must be a non-empty string not exceeding 50 characters.")
            .When(x => x.LanguagesSpoken is not null);
    }
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE AVAILABILITY
// ════════════════════════════════════════════════════════════════════════════

public class CreateAvailabilityRequestValidator : AbstractValidator<CreateAvailabilityRequest>
{
    public CreateAvailabilityRequestValidator()
    {
        RuleFor(x => x.DayOfWeek)
            .InclusiveBetween(0, 6)
            .WithMessage("DayOfWeek must be between 0 (Sunday) and 6 (Saturday).");

        RuleFor(x => x.StartTime)
            .NotEmpty().WithMessage("Start time is required.")
            .Matches(@"^([01]\d|2[0-3]):([0-5]\d)$")
            .WithMessage("Start time must be in HH:mm format (e.g., 09:00).");

        RuleFor(x => x.EndTime)
            .NotEmpty().WithMessage("End time is required.")
            .Matches(@"^([01]\d|2[0-3]):([0-5]\d)$")
            .WithMessage("End time must be in HH:mm format (e.g., 13:00).");

        // Cross-field: end must be after start
        RuleFor(x => x)
            .Must(r =>
            {
                if (!TimeOnly.TryParse(r.StartTime, out var start) ||
                    !TimeOnly.TryParse(r.EndTime, out var end))
                    return true; // format errors caught above
                return start < end;
            })
            .WithMessage("Start time must be before end time.")
            .WithName("TimeRange");

        RuleFor(x => x.SlotDurationMinutes)
            .InclusiveBetween(10, 120)
            .WithMessage("Slot duration must be between 10 and 120 minutes.");

        // Cross-field: slot duration must fit within the availability window
        RuleFor(x => x)
            .Must(r =>
            {
                if (!TimeOnly.TryParse(r.StartTime, out var start) ||
                    !TimeOnly.TryParse(r.EndTime, out var end))
                    return true;
                return r.SlotDurationMinutes <= (int)(end - start).TotalMinutes;
            })
            .WithMessage("Slot duration must not exceed the total availability window.")
            .WithName("SlotDuration");
    }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE AVAILABILITY
// ════════════════════════════════════════════════════════════════════════════

public class UpdateAvailabilityRequestValidator : AbstractValidator<UpdateAvailabilityRequest>
{
    public UpdateAvailabilityRequestValidator()
    {
        RuleFor(x => x.StartTime)
            .Matches(@"^([01]\d|2[0-3]):([0-5]\d)$")
            .WithMessage("Start time must be in HH:mm format (e.g., 09:00).")
            .When(x => x.StartTime is not null);

        RuleFor(x => x.EndTime)
            .Matches(@"^([01]\d|2[0-3]):([0-5]\d)$")
            .WithMessage("End time must be in HH:mm format (e.g., 13:00).")
            .When(x => x.EndTime is not null);

        // Cross-field: if both times provided, end must be after start
        RuleFor(x => x)
            .Must(r =>
            {
                if (r.StartTime is null || r.EndTime is null) return true;
                if (!TimeOnly.TryParse(r.StartTime, out var start) ||
                    !TimeOnly.TryParse(r.EndTime, out var end))
                    return true;
                return start < end;
            })
            .WithMessage("Start time must be before end time.")
            .WithName("TimeRange")
            .When(x => x.StartTime is not null && x.EndTime is not null);

        RuleFor(x => x.SlotDurationMinutes)
            .InclusiveBetween(10, 120)
            .WithMessage("Slot duration must be between 10 and 120 minutes.")
            .When(x => x.SlotDurationMinutes.HasValue);
    }
}

