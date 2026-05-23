namespace PatientDoctorConsultation.Modules.Patient.DTOs;

public sealed record PatientProfileDto(
    Guid Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    DateTime? DateOfBirth,
    string? Gender,
    string? BloodGroup,
    string? AvatarUrl,
    DateTime CreatedAt
);

public sealed record UpdatePatientProfileRequest(
    string FullName,
    string? PhoneNumber,
    DateTime? DateOfBirth,
    string? Gender,
    string? BloodGroup
);
