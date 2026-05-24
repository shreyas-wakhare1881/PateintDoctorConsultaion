using PatientDoctorConsultation.Modules.Patient.DTOs;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.Patient.Interfaces;

public interface IPatientService
{
    // ── Patient Profile ────────────────────────────────────────────────────────
    Task<PatientProfileResponse> CreateProfileAsync(Guid userId, CreatePatientProfileRequest request, CancellationToken ct = default);
    Task<PatientProfileResponse> GetMyProfileAsync(Guid userId, CancellationToken ct = default);
    Task<PatientProfileResponse> UpdateProfileAsync(Guid userId, UpdatePatientProfileRequest request, CancellationToken ct = default);
    Task DeleteProfileAsync(Guid userId, CancellationToken ct = default);

    // ── Doctor Discovery (patient-scoped) ──────────────────────────────────────
    Task<PaginatedResponse<PatientDoctorDiscoveryItem>> GetDoctorsAsync(PatientDoctorListQuery query, CancellationToken ct = default);
}

