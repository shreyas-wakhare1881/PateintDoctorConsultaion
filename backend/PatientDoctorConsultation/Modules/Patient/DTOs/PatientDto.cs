namespace PatientDoctorConsultation.Modules.Patient.DTOs;

// ════════════════════════════════════════════════════════════════════════════
// PROFILE — CREATE
// ════════════════════════════════════════════════════════════════════════════

/// <summary>
/// All fields are optional at creation time.
/// IsProfileCompleted is set to true when Gender, DateOfBirth, BloodGroup, and City are all provided.
/// UserId is always sourced from JWT — never accepted from request body.
/// </summary>
public sealed record CreatePatientProfileRequest(
    string? Gender,
    DateOnly? DateOfBirth,
    string? BloodGroup,
    int? HeightCm,
    decimal? WeightKg,
    string? Allergies,
    string? ChronicDiseases,
    string? EmergencyContactName,
    string? EmergencyContactPhone,
    string? Address,
    string? City,
    string? State,
    string? Country
);

// ════════════════════════════════════════════════════════════════════════════
// PROFILE — UPDATE (PARTIAL)
// ════════════════════════════════════════════════════════════════════════════

/// <summary>
/// All fields are optional. Only non-null fields are applied to the stored record.
/// PUT semantics with PATCH behaviour — SDD-aligned partial update.
/// </summary>
public sealed record UpdatePatientProfileRequest(
    string? Gender,
    DateOnly? DateOfBirth,
    string? BloodGroup,
    int? HeightCm,
    decimal? WeightKg,
    string? Allergies,
    string? ChronicDiseases,
    string? EmergencyContactName,
    string? EmergencyContactPhone,
    string? Address,
    string? City,
    string? State,
    string? Country
);

// ════════════════════════════════════════════════════════════════════════════
// PROFILE — RESPONSE
// ════════════════════════════════════════════════════════════════════════════

/// <summary>
/// Full patient profile — returned only to the authenticated profile owner.
/// Medical fields (BloodGroup, Allergies, ChronicDiseases) are included here
/// because the owner is the only recipient. These fields are NEVER exposed
/// publicly or to any other module.
/// </summary>
public sealed record PatientProfileResponse(
    Guid Id,
    Guid UserId,
    string FullName,
    string Email,
    string? Gender,
    DateOnly? DateOfBirth,
    string? BloodGroup,
    int? HeightCm,
    decimal? WeightKg,
    string? Allergies,
    string? ChronicDiseases,
    string? EmergencyContactName,
    string? EmergencyContactPhone,
    string? Address,
    string? City,
    string? State,
    string? Country,
    string? ProfileImageUrl,
    bool IsProfileCompleted,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

// ════════════════════════════════════════════════════════════════════════════
// DOCTOR DISCOVERY — QUERY PARAMS
// ════════════════════════════════════════════════════════════════════════════

/// <summary>
/// Query parameters for GET /api/patients/doctors.
/// Bound from [FromQuery] in the controller.
/// </summary>
public sealed class PatientDoctorListQuery
{
    public string? City           { get; init; }
    public string? Specialization { get; init; }
    public string? Language       { get; init; }
    public decimal? MinFee        { get; init; }
    public decimal? MaxFee        { get; init; }
    public int Page               { get; init; } = 1;
    public int PageSize           { get; init; } = 10;
}

// ════════════════════════════════════════════════════════════════════════════
// DOCTOR DISCOVERY — ITEM RESPONSE
// ════════════════════════════════════════════════════════════════════════════

/// <summary>
/// One doctor card in the patient-facing discovery list.
/// PRIVACY: No patient medical data is ever included.
/// PRIVACY: No sensitive doctor fields (UserId, LicenseNumber) are included.
/// </summary>
public sealed record PatientDoctorDiscoveryItem(
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

