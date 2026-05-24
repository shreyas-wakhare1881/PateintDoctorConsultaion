using FluentValidation;
using PatientDoctorConsultation.Modules.Patient.DTOs;

namespace PatientDoctorConsultation.Modules.Patient.Validators;

// ════════════════════════════════════════════════════════════════════════════
// SHARED CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

internal static class PatientValidationConstants
{
    internal static readonly string[] ValidGenders =
        ["Male", "Female", "Other", "PreferNotToSay"];

    internal static readonly string[] ValidBloodGroups =
        ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    internal static string GenderMessage =>
        $"Gender must be one of: {string.Join(", ", ValidGenders)}.";

    internal static string BloodGroupMessage =>
        $"Blood group must be one of: {string.Join(", ", ValidBloodGroups)}.";

    internal static bool IsValidAge(DateOnly dob)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var age   = today.Year - dob.Year;
        if (dob.AddYears(age) > today) age--;
        return age >= 0 && age <= 120;
    }
}

// ════════════════════════════════════════════════════════════════════════════
// CREATE PROFILE
// ════════════════════════════════════════════════════════════════════════════

public class CreatePatientProfileRequestValidator : AbstractValidator<CreatePatientProfileRequest>
{
    public CreatePatientProfileRequestValidator()
    {
        RuleFor(x => x.Gender)
            .Must(g => PatientValidationConstants.ValidGenders.Contains(g!))
            .WithMessage(PatientValidationConstants.GenderMessage)
            .When(x => x.Gender is not null);

        RuleFor(x => x.DateOfBirth)
            .Must(d => d!.Value < DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Date of birth must be in the past.")
            .Must(d => PatientValidationConstants.IsValidAge(d!.Value))
            .WithMessage("Patient age must be between 0 and 120 years.")
            .When(x => x.DateOfBirth.HasValue);

        RuleFor(x => x.BloodGroup)
            .Must(b => PatientValidationConstants.ValidBloodGroups.Contains(b!))
            .WithMessage(PatientValidationConstants.BloodGroupMessage)
            .When(x => x.BloodGroup is not null);

        RuleFor(x => x.HeightCm)
            .InclusiveBetween(50, 300).WithMessage("Height must be between 50 and 300 cm.")
            .When(x => x.HeightCm.HasValue);

        RuleFor(x => x.WeightKg)
            .InclusiveBetween(1m, 500m).WithMessage("Weight must be between 1 and 500 kg.")
            .When(x => x.WeightKg.HasValue);

        RuleFor(x => x.Allergies)
            .MaximumLength(1000).WithMessage("Allergies description must not exceed 1000 characters.")
            .When(x => x.Allergies is not null);

        RuleFor(x => x.ChronicDiseases)
            .MaximumLength(1000).WithMessage("Chronic diseases description must not exceed 1000 characters.")
            .When(x => x.ChronicDiseases is not null);

        RuleFor(x => x.EmergencyContactName)
            .MaximumLength(150).WithMessage("Emergency contact name must not exceed 150 characters.")
            .When(x => x.EmergencyContactName is not null);

        RuleFor(x => x.EmergencyContactPhone)
            .Matches(@"^\+[1-9]\d{6,14}$")
            .WithMessage("Emergency contact phone must include a valid country code (e.g., +919999999999).")
            .When(x => x.EmergencyContactPhone is not null);

        RuleFor(x => x.Address)
            .MaximumLength(512).WithMessage("Address must not exceed 512 characters.")
            .When(x => x.Address is not null);

        RuleFor(x => x.City)
            .MaximumLength(100).WithMessage("City must not exceed 100 characters.")
            .When(x => x.City is not null);

        RuleFor(x => x.State)
            .MaximumLength(100).WithMessage("State must not exceed 100 characters.")
            .When(x => x.State is not null);

        RuleFor(x => x.Country)
            .MaximumLength(100).WithMessage("Country must not exceed 100 characters.")
            .When(x => x.Country is not null);
    }
}

// ════════════════════════════════════════════════════════════════════════════
// UPDATE PROFILE
// ════════════════════════════════════════════════════════════════════════════

public class UpdatePatientProfileRequestValidator : AbstractValidator<UpdatePatientProfileRequest>
{
    public UpdatePatientProfileRequestValidator()
    {
        RuleFor(x => x.Gender)
            .Must(g => PatientValidationConstants.ValidGenders.Contains(g!))
            .WithMessage(PatientValidationConstants.GenderMessage)
            .When(x => x.Gender is not null);

        RuleFor(x => x.DateOfBirth)
            .Must(d => d!.Value < DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Date of birth must be in the past.")
            .Must(d => PatientValidationConstants.IsValidAge(d!.Value))
            .WithMessage("Patient age must be between 0 and 120 years.")
            .When(x => x.DateOfBirth.HasValue);

        RuleFor(x => x.BloodGroup)
            .Must(b => PatientValidationConstants.ValidBloodGroups.Contains(b!))
            .WithMessage(PatientValidationConstants.BloodGroupMessage)
            .When(x => x.BloodGroup is not null);

        RuleFor(x => x.HeightCm)
            .InclusiveBetween(50, 300).WithMessage("Height must be between 50 and 300 cm.")
            .When(x => x.HeightCm.HasValue);

        RuleFor(x => x.WeightKg)
            .InclusiveBetween(1m, 500m).WithMessage("Weight must be between 1 and 500 kg.")
            .When(x => x.WeightKg.HasValue);

        RuleFor(x => x.Allergies)
            .MaximumLength(1000).WithMessage("Allergies description must not exceed 1000 characters.")
            .When(x => x.Allergies is not null);

        RuleFor(x => x.ChronicDiseases)
            .MaximumLength(1000).WithMessage("Chronic diseases description must not exceed 1000 characters.")
            .When(x => x.ChronicDiseases is not null);

        RuleFor(x => x.EmergencyContactName)
            .MaximumLength(150).WithMessage("Emergency contact name must not exceed 150 characters.")
            .When(x => x.EmergencyContactName is not null);

        RuleFor(x => x.EmergencyContactPhone)
            .Matches(@"^\+[1-9]\d{6,14}$")
            .WithMessage("Emergency contact phone must include a valid country code (e.g., +919999999999).")
            .When(x => x.EmergencyContactPhone is not null);

        RuleFor(x => x.Address)
            .MaximumLength(512).WithMessage("Address must not exceed 512 characters.")
            .When(x => x.Address is not null);

        RuleFor(x => x.City)
            .MaximumLength(100).WithMessage("City must not exceed 100 characters.")
            .When(x => x.City is not null);

        RuleFor(x => x.State)
            .MaximumLength(100).WithMessage("State must not exceed 100 characters.")
            .When(x => x.State is not null);

        RuleFor(x => x.Country)
            .MaximumLength(100).WithMessage("Country must not exceed 100 characters.")
            .When(x => x.Country is not null);
    }
}