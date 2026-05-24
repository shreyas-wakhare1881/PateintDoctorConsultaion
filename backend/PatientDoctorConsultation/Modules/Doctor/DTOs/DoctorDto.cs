namespace PatientDoctorConsultation.Modules.Doctor.DTOs;

// ════════════════════════════════════════════════════════════════════════════
// REQUEST DTOs
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Payload to create a new doctor profile during onboarding.</summary>
public sealed record CreateDoctorProfileRequest(
    string Specialization,
    string Qualification,
    int ExperienceYears,
    string LicenseNumber,
    string? Bio,
    string? ProfileImageUrl,
    decimal ConsultationFee,
    string? HospitalName,
    string? ClinicAddress,
    string City,
    string? State,
    string? Country,
    List<string>? LanguagesSpoken
);

/// <summary>Payload to partially update a doctor's professional profile. All fields optional.</summary>
public sealed record UpdateDoctorProfileRequest(
    string? Specialization,
    string? Qualification,
    int? ExperienceYears,
    string? LicenseNumber,
    string? Bio,
    string? ProfileImageUrl,
    decimal? ConsultationFee,
    string? HospitalName,
    string? ClinicAddress,
    string? City,
    string? State,
    string? Country,
    List<string>? LanguagesSpoken
);

/// <summary>Payload to add a recurring weekly consultation availability slot.</summary>
public sealed record CreateAvailabilityRequest(
    int DayOfWeek,
    string StartTime,
    string EndTime,
    int SlotDurationMinutes
);

/// <summary>Payload to partially update an existing availability slot.</summary>
public sealed record UpdateAvailabilityRequest(
    string? StartTime,
    string? EndTime,
    int? SlotDurationMinutes,
    bool? IsAvailable
);

// ════════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Full doctor profile — returned to the authenticated doctor (includes private fields).</summary>
public sealed record DoctorProfileResponse(
    Guid Id,
    Guid UserId,
    string FullName,
    string Email,
    string? Specialization,
    string? Qualification,
    int? ExperienceYears,
    string? LicenseNumber,
    string? Bio,
    string? ProfileImageUrl,
    decimal? ConsultationFee,
    string? HospitalName,
    string? ClinicAddress,
    string? City,
    string? State,
    string? Country,
    IReadOnlyList<string> LanguagesSpoken,
    string ApprovalStatus,
    decimal? Rating,
    int TotalReviews,
    int TotalConsultations,
    bool IsProfileCompleted,
    bool IsPubliclyVisible,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

/// <summary>Trimmed public-facing doctor listing card. Private fields omitted.</summary>
public sealed record DoctorPublicListItemResponse(
    Guid Id,
    string FullName,
    string? Specialization,
    string? Qualification,
    int? ExperienceYears,
    decimal? ConsultationFee,
    decimal? Rating,
    int TotalReviews,
    string? City,
    IReadOnlyList<string> LanguagesSpoken,
    string? ProfileImageUrl
);

/// <summary>Full public doctor detail page — includes profile + available slots.</summary>
public sealed record DoctorPublicDetailResponse(
    Guid Id,
    string FullName,
    string? Specialization,
    string? Qualification,
    int? ExperienceYears,
    string? Bio,
    decimal? ConsultationFee,
    string? HospitalName,
    string? City,
    string? State,
    string? Country,
    IReadOnlyList<string> LanguagesSpoken,
    decimal? Rating,
    int TotalReviews,
    int TotalConsultations,
    string? ProfileImageUrl,
    IReadOnlyList<AvailabilityPublicSlotResponse> Availability
);

/// <summary>Full availability slot response — returned to the authenticated doctor.</summary>
public sealed record AvailabilityResponse(
    Guid Id,
    int DayOfWeek,
    string StartTime,
    string EndTime,
    int SlotDurationMinutes,
    bool IsAvailable,
    DateTime CreatedAt
);

/// <summary>Sanitized availability slot for public doctor detail page (no internal IDs).</summary>
public sealed record AvailabilityPublicSlotResponse(
    int DayOfWeek,
    string StartTime,
    string EndTime,
    int SlotDurationMinutes
);

// ════════════════════════════════════════════════════════════════════════════
// QUERY PARAMETERS
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Filters and pagination for the public doctor listing endpoint.</summary>
public sealed class DoctorListQuery
{
    public string? City { get; init; }
    public string? Specialization { get; init; }
    public string? Language { get; init; }
    public decimal? MinFee { get; init; }
    public decimal? MaxFee { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}

