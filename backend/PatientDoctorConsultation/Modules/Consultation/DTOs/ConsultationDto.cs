using PatientDoctorConsultation.Modules.Consultation.Enums;
using PatientDoctorConsultation.Shared.Enums;

namespace PatientDoctorConsultation.Modules.Consultation.DTOs;

// ════════════════════════════════════════════════════════════════════════════
// REQUEST DTOs
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Patient submits this to book a new consultation.</summary>
public sealed record BookConsultationRequest(
    Guid DoctorId,
    Guid? AvailabilityId,
    DateOnly ScheduledDate,
    string StartTime,        // "HH:mm:ss" — parsed to TimeOnly in service
    string EndTime,          // "HH:mm:ss" — parsed to TimeOnly in service
    string TimeZone,         // IANA timezone e.g. "Asia/Kolkata"
    string ConsultationType, // "Video" | "InPerson"
    string Symptoms,
    bool IsFollowUp = false,
    Guid? ParentConsultationId = null
);

/// <summary>Payload to cancel an active consultation. Required by Patient, Doctor, or Admin.</summary>
public sealed record CancelConsultationRequest(
    string Reason
);

/// <summary>Doctor rejects a pending consultation request.</summary>
public sealed record RejectConsultationRequest(
    string Reason
);

/// <summary>Doctor marks a consultation as completed, optionally adding clinical notes.</summary>
public sealed record CompleteConsultationRequest(
    string? Notes
);

// ════════════════════════════════════════════════════════════════════════════
// QUERY / FILTER DTOs
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Filter for paginated consultation list endpoints.</summary>
public sealed record ConsultationListQuery(
    string? Status = null,   // ConsultationStatus enum value as string
    int Page = 1,
    int PageSize = 10
);

/// <summary>Filter for doctor's schedule endpoint.</summary>
public sealed record DoctorScheduleQuery(
    DateOnly? Date = null,
    int Page = 1,
    int PageSize = 20
);

/// <summary>Admin filter — supports all combination filters.</summary>
public sealed record AdminConsultationQuery(
    string? Status = null,
    Guid? DoctorId = null,
    Guid? PatientId = null,
    DateOnly? DateFrom = null,
    DateOnly? DateTo = null,
    string? ConsultationType = null,
    int Page = 1,
    int PageSize = 20
);

// ════════════════════════════════════════════════════════════════════════════
// RESPONSE DTOs
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Lightweight consultation card used in list views.</summary>
public sealed record ConsultationSummaryResponse(
    Guid Id,
    string ConsultationNumber,
    string Status,
    string ConsultationType,
    DateOnly ScheduledDate,
    string StartTime,
    string EndTime,
    // Doctor summary (surfaced for patient list view)
    Guid DoctorId,
    string DoctorName,
    string? DoctorSpecialization,
    string? DoctorProfileImageUrl,
    // Patient summary (surfaced for doctor/admin list view)
    Guid PatientId,
    string PatientName,
    decimal ConsultationFeeSnapshot,
    bool IsFollowUp,
    DateTime CreatedAt
);

/// <summary>Full consultation detail response returned on GET by id and after state transitions.</summary>
public sealed record ConsultationDetailsResponse(
    Guid Id,
    string ConsultationNumber,
    string Status,
    string ConsultationType,
    DateOnly ScheduledDate,
    string StartTime,
    string EndTime,
    string TimeZone,
    // Participants
    Guid DoctorId,
    string DoctorName,
    string? DoctorSpecialization,
    string? DoctorProfileImageUrl,
    Guid PatientId,
    string PatientName,
    // Clinical
    string Symptoms,
    string? Notes,
    // Cancellation
    string? CancellationReason,
    string? CancelledBy,
    // Video fields
    string? MeetingRoomId,
    string? MeetingLink,
    DateTime? MeetingStartedAt,
    DateTime? MeetingEndedAt,
    // Fee & follow-up
    decimal ConsultationFeeSnapshot,
    bool IsFollowUp,
    Guid? ParentConsultationId,
    // Audit
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

/// <summary>Single entry in the consultation status audit trail.</summary>
public sealed record ConsultationStatusHistoryResponse(
    Guid Id,
    Guid ConsultationId,
    string? OldStatus,
    string NewStatus,
    Guid ChangedByUserId,
    string ChangedByName,
    string? Reason,
    DateTime CreatedAt
);

/// <summary>Issued to an authorized consultation participant for joining LiveKit room.</summary>
public sealed record ConsultationVideoTokenResponse(
    Guid ConsultationId,
    string MeetingRoomId,
    string AccessToken,
    string LiveKitUrl,
    string ParticipantIdentity,
    DateTime ExpiresAt
);

