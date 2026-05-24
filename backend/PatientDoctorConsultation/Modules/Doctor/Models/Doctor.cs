using PatientDoctorConsultation.Shared.Common;
using PatientDoctorConsultation.Shared.Enums;

namespace PatientDoctorConsultation.Modules.Doctor.Models;

/// <summary>
/// Stores the professional profile for a registered doctor.
/// Authentication fields (email, password, role) live in the Users table (Auth Module).
/// This entity is the single source of truth for doctor professional data.
/// </summary>
public class Doctor : BaseAuditableEntity
{
    // ── Identity Link ─────────────────────────────────────────────────────────
    /// <summary>FK → Users.Id (one-to-one). No navigation property — cross-module isolation.</summary>
    public Guid UserId { get; set; }

    // ── Professional Profile ──────────────────────────────────────────────────
    public string? Specialization { get; set; }
    public string? Qualification { get; set; }
    public int? ExperienceYears { get; set; }
    public string? LicenseNumber { get; set; }
    public string? Bio { get; set; }
    public string? ProfileImageUrl { get; set; }

    // ── Consultation Metadata ─────────────────────────────────────────────────
    public decimal? ConsultationFee { get; set; }
    public List<string>? LanguagesSpoken { get; set; }

    // ── Practice Location ─────────────────────────────────────────────────────
    public string? HospitalName { get; set; }
    public string? ClinicAddress { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }

    // ── Approval & Visibility ─────────────────────────────────────────────────
    public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;
    public bool IsProfileCompleted { get; set; } = false;
    public bool IsPubliclyVisible { get; set; } = false;

    // ── Engagement Metrics (updated by Consultation Module) ───────────────────
    public decimal? Rating { get; set; }
    public int TotalReviews { get; set; } = 0;
    public int TotalConsultations { get; set; } = 0;

    // ── Soft Delete ───────────────────────────────────────────────────────────
    public DateTime? DeletedAt { get; set; }

    // ── Navigation Properties ─────────────────────────────────────────────────
    public ICollection<DoctorAvailability> Availabilities { get; set; } = new List<DoctorAvailability>();
}
