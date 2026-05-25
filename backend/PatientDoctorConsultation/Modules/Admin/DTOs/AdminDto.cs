namespace PatientDoctorConsultation.Modules.Admin.DTOs;

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Aggregated platform statistics returned by the admin dashboard.</summary>
public sealed record AdminDashboardResponse(
    int TotalDoctors,
    int PendingDoctors,
    int SuspendedDoctors,
    int TotalActivePatients,
    int TotalConsultations,
    int CompletedConsultations,
    int CancelledConsultations,
    int TodayConsultations
);

// ════════════════════════════════════════════════════════════════════════════
// DOCTOR MODERATION — QUERIES
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Filter for paginated doctor list.</summary>
public sealed record AdminDoctorListQuery(
    string? ApprovalStatus = null,   // "Pending" | "Approved" | "Rejected" | "Suspended"
    string? City = null,
    string? Search = null,           // name / email / license number
    int Page = 1,
    int PageSize = 20
);

// ════════════════════════════════════════════════════════════════════════════
// DOCTOR MODERATION — RESPONSES
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Doctor list item for admin overview grid.</summary>
public sealed record AdminDoctorListItem(
    Guid DoctorId,
    Guid UserId,
    string FullName,
    string? Email,
    string? Specialization,
    string ApprovalStatus,
    bool IsPubliclyVisible,
    bool IsProfileCompleted,
    string? City,
    DateTime CreatedAt
);

/// <summary>Enriched item for the pending-approval queue.</summary>
public sealed record AdminPendingDoctorItem(
    Guid DoctorId,
    Guid UserId,
    string FullName,
    string? Email,
    string? Specialization,
    string? Qualification,
    string? LicenseNumber,
    int? ExperienceYears,
    string? City,
    bool IsProfileCompleted,
    DateTime CreatedAt
);

/// <summary>Outcome of a moderation action on a doctor.</summary>
public sealed record DoctorModerationResponse(
    Guid DoctorId,
    string ApprovalStatus,
    bool IsPubliclyVisible
);

// ════════════════════════════════════════════════════════════════════════════
// DOCTOR MODERATION — REQUESTS
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Optional reason supplied by the admin for approve/reject/suspend/reactivate.</summary>
public sealed record DoctorModerationRequest(string? Reason);

// ════════════════════════════════════════════════════════════════════════════
// PATIENT MODERATION — QUERIES
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Filter for paginated patient list.</summary>
public sealed record AdminPatientListQuery(
    bool? IsActive = null,
    string? Search = null,   // full name / phone number
    int Page = 1,
    int PageSize = 20
);

// ════════════════════════════════════════════════════════════════════════════
// PATIENT MODERATION — RESPONSES
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Patient list item for admin moderation view.</summary>
public sealed record AdminPatientListItem(
    Guid UserId,
    string FullName,
    string PhoneNumber,
    bool IsActive,
    bool IsVerified,
    DateTime CreatedAt
);

/// <summary>Outcome of a block/unblock action on a patient.</summary>
public sealed record PatientModerationResponse(
    Guid UserId,
    bool IsActive
);

// ════════════════════════════════════════════════════════════════════════════
// PATIENT MODERATION — REQUESTS
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Optional reason for patient block/unblock action.</summary>
public sealed record PatientModerationRequest(string? Reason);

// ════════════════════════════════════════════════════════════════════════════
// CONSULTATION MONITORING — QUERIES
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Multi-dimensional filter for admin consultation monitoring.</summary>
public sealed record AdminConsultationListQuery(
    string? Status = null,
    Guid? DoctorId = null,
    Guid? PatientId = null,
    DateOnly? DateFrom = null,
    DateOnly? DateTo = null,
    int Page = 1,
    int PageSize = 20
);

// ════════════════════════════════════════════════════════════════════════════
// CONSULTATION MONITORING — RESPONSES
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Consultation row for admin monitoring list.</summary>
public sealed record AdminConsultationListItem(
    Guid ConsultationId,
    string ConsultationNumber,
    string PatientName,
    string DoctorName,
    string? Specialization,
    string Status,
    DateOnly ScheduledDate,
    TimeOnly StartTime,
    DateTime CreatedAt
);

/// <summary>Full consultation detail for admin review. Read-only — admin cannot modify medical data.</summary>
public sealed record AdminConsultationDetail(
    Guid ConsultationId,
    string ConsultationNumber,
    string PatientName,
    string PatientPhone,
    string DoctorName,
    string? Specialization,
    string Status,
    DateOnly ScheduledDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string? Symptoms,
    string? CancellationReason,
    DateTime? MeetingStartedAt,
    DateTime? MeetingEndedAt,
    DateTime CreatedAt,
    IReadOnlyList<ConsultationStatusHistoryItem> StatusHistory
);

/// <summary>Single row from ConsultationStatusHistories for admin detail view.</summary>
public sealed record ConsultationStatusHistoryItem(
    string NewStatus,
    string? OldStatus,
    string? Reason,
    DateTime ChangedAt
);

// ════════════════════════════════════════════════════════════════════════════
// AUDIT LOGS — QUERIES
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Filter for paginated admin audit log feed.</summary>
public sealed record AdminAuditLogQuery(
    Guid? AdminUserId = null,
    string? ActionType = null,
    string? TargetEntityType = null,
    Guid? TargetEntityId = null,
    DateOnly? DateFrom = null,
    DateOnly? DateTo = null,
    int Page = 1,
    int PageSize = 20
);

// ════════════════════════════════════════════════════════════════════════════
// AUDIT LOGS — RESPONSES
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Single audit log entry for governance review.</summary>
public sealed record AdminAuditLogListItem(
    Guid Id,
    Guid AdminUserId,
    string AdminName,
    string ActionType,
    string TargetEntityType,
    Guid TargetEntityId,
    string? Reason,
    DateTime CreatedAt
);

