using PatientDoctorConsultation.Shared.Common;
using PatientDoctorConsultation.Shared.Enums;

namespace PatientDoctorConsultation.Modules.Consultation.Models;

/// <summary>
/// Append-only audit log for every ConsultationStatus transition.
/// Insert-only — no updates or deletes are permitted on this table.
/// Every status change on a Consultation row must produce one row here.
/// </summary>
public class ConsultationStatusHistory : BaseEntity
{
    // ── Foreign Keys ──────────────────────────────────────────────────────────
    /// <summary>FK → Consultations.Id. CASCADE on delete.</summary>
    public Guid ConsultationId { get; set; }

    // ── Transition Data ───────────────────────────────────────────────────────
    /// <summary>Status before the transition. NULL for the initial booking creation event.</summary>
    public ConsultationStatus? OldStatus { get; set; }

    /// <summary>Status after the transition. Always populated.</summary>
    public ConsultationStatus NewStatus { get; set; }

    // ── Audit ─────────────────────────────────────────────────────────────────
    /// <summary>FK → Users.Id. The authenticated user who triggered the transition.</summary>
    public Guid ChangedByUserId { get; set; }

    /// <summary>Human-readable reason. Mandatory for Cancelled and Rejected transitions.</summary>
    public string? Reason { get; set; }

    /// <summary>Immutable creation timestamp of this transition record.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation Properties (within-module) ─────────────────────────────────
    public Consultation Consultation { get; set; } = null!;
}
