namespace PatientDoctorConsultation.Modules.Admin.DTOs;

public sealed record AdminDashboardDto(
    int TotalDoctors,
    int TotalPatients,
    int TotalConsultations,
    int ActiveConsultations,
    int PendingDoctorVerifications
);

public sealed record DoctorVerificationRequest(
    Guid DoctorId,
    bool IsApproved,
    string? Remarks
);
