namespace PatientDoctorConsultation.Modules.Doctor.DTOs;

public sealed record DoctorProfileDto(
    Guid Id,
    string FullName,
    string Email,
    string Specialization,
    string? PhoneNumber,
    string? Bio,
    string? AvatarUrl,
    decimal ConsultationFee,
    bool IsAvailable,
    DateTime CreatedAt
);

public sealed record UpdateDoctorProfileRequest(
    string FullName,
    string Specialization,
    string? PhoneNumber,
    string? Bio,
    decimal ConsultationFee
);

public sealed record DoctorListItemDto(
    Guid Id,
    string FullName,
    string Specialization,
    string? AvatarUrl,
    decimal ConsultationFee,
    bool IsAvailable
);
