using PatientDoctorConsultation.Modules.Consultation.Enums;
using PatientDoctorConsultation.Shared.Common;
using PatientDoctorConsultation.Shared.Enums;

namespace PatientDoctorConsultation.Modules.Consultation.Models;

/// <summary>
/// Core booking entity for the Consultation Module.
/// References PatientId and DoctorId as cross-module FK stubs — no navigation properties
/// to Patient/Doctor entities (modular monolith boundary).
/// Navigation properties exist only for within-module relations:
/// StatusHistories and FollowUps (self-reference).
/// </summary>
public class Consultation : BaseAuditableEntity
{
    // ── Core Participants (cross-module FK stubs) ─────────────────────────────
    /// <summary>FK → Patients.Id. RESTRICT on delete.</summary>
    public Guid PatientId { get; set; }

    /// <summary>FK → Doctors.Id. RESTRICT on delete.</summary>
    public Guid DoctorId { get; set; }

    /// <summary>FK → DoctorAvailabilities.Id. Nullable — SET NULL on delete.</summary>
    public Guid? AvailabilityId { get; set; }

    // ── Booking Identity ──────────────────────────────────────────────────────
    /// <summary>Human-readable unique booking reference e.g. CONS-20260610-0042.</summary>
    public string ConsultationNumber { get; set; } = string.Empty;

    // ── Schedule ──────────────────────────────────────────────────────────────
    /// <summary>Confirmed date of consultation — maps to PostgreSQL date.</summary>
    public DateOnly ScheduledDate { get; set; }

    /// <summary>Session start time stored in UTC — maps to PostgreSQL time without time zone.</summary>
    public TimeOnly StartTime { get; set; }

    /// <summary>Expected session end time stored in UTC — maps to PostgreSQL time without time zone.</summary>
    public TimeOnly EndTime { get; set; }

    /// <summary>IANA timezone of the booking e.g. Asia/Kolkata.</summary>
    public string TimeZone { get; set; } = string.Empty;

    // ── Status & Type ─────────────────────────────────────────────────────────
    public ConsultationStatus Status { get; set; } = ConsultationStatus.Pending;
    public ConsultationType ConsultationType { get; set; }

    // ── Clinical Data ─────────────────────────────────────────────────────────
    /// <summary>Patient-reported symptoms submitted at booking time. Required.</summary>
    public string Symptoms { get; set; } = string.Empty;

    /// <summary>Doctor's clinical notes added post-session. Optional.</summary>
    public string? Notes { get; set; }

    // ── Cancellation ──────────────────────────────────────────────────────────
    public string? CancellationReason { get; set; }
    public CancelledBy? CancelledBy { get; set; }

    // ── Video Consultation Fields (schema-ready; populated for Video type) ────
    /// <summary>Video platform room identifier. Populated when ConsultationType = Video.</summary>
    public string? MeetingRoomId { get; set; }

    /// <summary>Shareable join URL for the video session.</summary>
    public string? MeetingLink { get; set; }

    /// <summary>Actual UTC time the meeting room was entered.</summary>
    public DateTime? MeetingStartedAt { get; set; }

    /// <summary>Actual UTC time the meeting room was closed.</summary>
    public DateTime? MeetingEndedAt { get; set; }

    // ── Fee Snapshot ──────────────────────────────────────────────────────────
    /// <summary>
    /// Doctor's consultation fee captured at booking time.
    /// Immutable after creation — decouples billing from future doctor profile changes.
    /// </summary>
    public decimal ConsultationFeeSnapshot { get; set; }

    // ── Follow-Up Chain ───────────────────────────────────────────────────────
    public bool IsFollowUp { get; set; } = false;

    /// <summary>Self-FK → Consultations.Id. Links follow-up to its parent. SET NULL on delete.</summary>
    public Guid? ParentConsultationId { get; set; }

    // ── Soft Delete ───────────────────────────────────────────────────────────
    public DateTime? DeletedAt { get; set; }

    // ── Navigation Properties (within-module only) ────────────────────────────
    public Consultation? ParentConsultation { get; set; }
    public ICollection<Consultation> FollowUps { get; set; } = new List<Consultation>();
    public ICollection<ConsultationStatusHistory> StatusHistories { get; set; } = new List<ConsultationStatusHistory>();
}

