using PatientDoctorConsultation.Shared.Common;

namespace PatientDoctorConsultation.Modules.Doctor.Models;

/// <summary>
/// Stores a recurring weekly availability slot for a doctor.
/// A doctor can have multiple rows per DayOfWeek (e.g., morning + evening).
/// Soft delete is NOT applied — slots are hard-deleted or toggled via IsAvailable.
/// </summary>
public class DoctorAvailability : BaseEntity
{
    // ── Foreign Key ───────────────────────────────────────────────────────────
    public Guid DoctorId { get; set; }

    // ── Schedule ──────────────────────────────────────────────────────────────
    /// <summary>0 = Sunday, 1 = Monday … 6 = Saturday</summary>
    public int DayOfWeek { get; set; }

    /// <summary>Slot window start time — maps to PostgreSQL time without time zone</summary>
    public TimeOnly StartTime { get; set; }

    /// <summary>Slot window end time — maps to PostgreSQL time without time zone. Must be after StartTime.</summary>
    public TimeOnly EndTime { get; set; }

    /// <summary>Duration per consultation booking within this window (e.g., 30 min).</summary>
    public int SlotDurationMinutes { get; set; } = 30;

    // ── Status ────────────────────────────────────────────────────────────────
    /// <summary>Toggle slot visibility without deletion. False = hidden from booking engine.</summary>
    public bool IsAvailable { get; set; } = true;

    // ── Audit ─────────────────────────────────────────────────────────────────
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation Properties ─────────────────────────────────────────────────
    public Doctor Doctor { get; set; } = null!;
}
