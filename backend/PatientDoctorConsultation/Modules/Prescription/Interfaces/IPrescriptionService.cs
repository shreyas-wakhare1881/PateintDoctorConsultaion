using PatientDoctorConsultation.Modules.Prescription.DTOs;

namespace PatientDoctorConsultation.Modules.Prescription.Interfaces;

public interface IPrescriptionService
{
    /// <summary>
    /// Creates a prescription for the given consultation. Only the assigned doctor may call this.
    /// doctorUserId is the authenticated User ID (JWT sub) — resolved to Doctor entity ID internally.
    /// </summary>
    Task<PrescriptionResponse> CreateAsync(Guid consultationId, Guid doctorUserId, CreatePrescriptionRequest request, CancellationToken ct = default);

    /// <summary>
    /// Gets the prescription for a consultation. Doctor or Patient (ownership validated) may call this.
    /// callerUserId is the authenticated User ID (JWT sub) — resolved to entity ID internally.
    /// </summary>
    Task<PrescriptionResponse> GetByConsultationAsync(Guid consultationId, Guid callerUserId, string callerRole, CancellationToken ct = default);

    /// <summary>
    /// Gets all prescriptions for the calling patient.
    /// patientUserId is the authenticated User ID (JWT sub) — resolved to Patient entity ID internally.
    /// </summary>
    Task<List<PrescriptionResponse>> GetMyPrescriptionsAsync(Guid patientUserId, CancellationToken ct = default);
}
