namespace PatientDoctorConsultation.Modules.Prescription.DTOs;

// ── Request Records ───────────────────────────────────────────────────────────

public sealed record CreatePrescriptionItemRequest(
    string MedicineName,
    string Dosage,
    string Frequency,
    string Duration,
    string? Instructions
);

public sealed record CreatePrescriptionRequest(
    string? Diagnosis,
    string? GeneralInstructions,
    List<CreatePrescriptionItemRequest> Items
);

// ── Response Records ──────────────────────────────────────────────────────────

public sealed record PrescriptionItemResponse(
    Guid Id,
    string MedicineName,
    string Dosage,
    string Frequency,
    string Duration,
    string? Instructions
);

public sealed record PrescriptionResponse(
    Guid Id,
    Guid ConsultationId,
    Guid DoctorId,
    Guid PatientId,
    string? Diagnosis,
    string? GeneralInstructions,
    DateTime IssuedAt,
    List<PrescriptionItemResponse> Items,
    DateTime CreatedAt
);
