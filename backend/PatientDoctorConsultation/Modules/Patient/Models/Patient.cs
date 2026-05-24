using PatientDoctorConsultation.Shared.Common;

namespace PatientDoctorConsultation.Modules.Patient.Models;

/// <summary>
/// Stores the healthcare profile for a registered patient.
/// Authentication fields (email, password, role, refresh tokens) live in the Users table (Auth Module).
/// This entity is the single source of truth for patient personal health data.
/// </summary>
public class Patient : BaseAuditableEntity
{
    // ── Identity Link ─────────────────────────────────────────────────────────
    /// <summary>FK → Users.Id (one-to-one). No navigation property — cross-module isolation.</summary>
    public Guid UserId { get; set; }

    // ── Basic Health Fields ───────────────────────────────────────────────────
    /// <summary>Allowed values: Male, Female, Other, PreferNotToSay</summary>
    public string? Gender { get; set; }

    /// <summary>Stored as date only — age is calculated at application layer on demand.</summary>
    public DateOnly? DateOfBirth { get; set; }

    /// <summary>Allowed values: A+, A-, B+, B-, AB+, AB-, O+, O-</summary>
    public string? BloodGroup { get; set; }

    // ── Physical Metrics ──────────────────────────────────────────────────────
    /// <summary>Height in centimetres (integer).</summary>
    public int? HeightCm { get; set; }

    /// <summary>Weight in kilograms — precision(5,2) e.g. 72.50 kg.</summary>
    public decimal? WeightKg { get; set; }

    // ── Medical Information ───────────────────────────────────────────────────
    /// <summary>Free-text allergy description. Max 1000 chars enforced at application layer.</summary>
    public string? Allergies { get; set; }

    /// <summary>Free-text chronic condition list e.g. "Type 2 Diabetes, Hypertension".</summary>
    public string? ChronicDiseases { get; set; }

    // ── Emergency Contact ─────────────────────────────────────────────────────
    public string? EmergencyContactName { get; set; }

    /// <summary>Phone number including country code e.g. +919999999999</summary>
    public string? EmergencyContactPhone { get; set; }

    // ── Location ──────────────────────────────────────────────────────────────
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }

    // ── Profile Metadata ──────────────────────────────────────────────────────
    /// <summary>CDN URL for patient profile photo — uploaded via storage service.</summary>
    public string? ProfileImageUrl { get; set; }

    /// <summary>
    /// True when all mandatory profile fields are present.
    /// Required fields per SDD: Gender, DateOfBirth, BloodGroup, City.
    /// Gates consultation booking capability.
    /// </summary>
    public bool IsProfileCompleted { get; set; } = false;

    // ── Soft Delete ───────────────────────────────────────────────────────────
    /// <summary>Soft-delete timestamp. NULL = active. Set by service layer on DELETE request.</summary>
    public DateTime? DeletedAt { get; set; }
}

