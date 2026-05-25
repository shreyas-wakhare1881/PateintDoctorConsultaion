using PatientDoctorConsultation.Modules.Admin.Enums;
using PatientDoctorConsultation.Modules.Auth.Models;
using PatientDoctorConsultation.Shared.Common;

namespace PatientDoctorConsultation.Modules.Admin.Models;

/// <summary>
/// Immutable audit record for every admin governance action on the platform.
/// Append-only — no UPDATE or DELETE is permitted on this table.
/// See: Admin Module SDD/Database.md
/// </summary>
public class AdminAuditLog : BaseEntity
{
    /// <summary>FK → Users.Id. The admin operator who performed the action.</summary>
    public Guid AdminUserId { get; set; }

    /// <summary>Machine-readable action label. Stored as string (e.g. "DoctorApproved").</summary>
    public AdminActionType ActionType { get; set; }

    /// <summary>Entity class affected by this action (e.g. "Doctor", "Patient").</summary>
    public AdminTargetEntityType TargetEntityType { get; set; }

    /// <summary>Primary key of the affected row in the target entity's table.</summary>
    public Guid TargetEntityId { get; set; }

    /// <summary>Optional human-readable moderation reason supplied by the admin.</summary>
    public string? Reason { get; set; }

    /// <summary>
    /// Optional JSONB snapshot — before/after state, changed fields, reviewer notes.
    /// Stored as jsonb in PostgreSQL.
    /// </summary>
    public string? MetadataJson { get; set; }

    /// <summary>Immutable UTC action timestamp.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ── Navigation ────────────────────────────────────────────────────────────

    /// <summary>
    /// Navigation to the admin User who performed this action.
    /// Cross-module reference: Users table (Auth module).
    /// FK enforced with ON DELETE RESTRICT — audit logs must never be orphaned.
    /// </summary>
    public User AdminUser { get; set; } = null!;
}
