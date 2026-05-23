using PatientDoctorConsultation.Shared.Enums;

namespace PatientDoctorConsultation.Modules.Consultation.DTOs;

public sealed record BookConsultationRequest(
    Guid DoctorId,
    DateTime ScheduledAt,
    string? Symptoms
);

public sealed record ConsultationDto(
    Guid Id,
    Guid PatientId,
    Guid DoctorId,
    string PatientName,
    string DoctorName,
    string DoctorSpecialization,
    DateTime ScheduledAt,
    ConsultationStatus Status,
    string? RoomId,
    string? Symptoms,
    string? AiSummary,
    DateTime CreatedAt
);

public sealed record ConsultationSummaryRequest(
    Guid ConsultationId,
    string TranscriptText
);
