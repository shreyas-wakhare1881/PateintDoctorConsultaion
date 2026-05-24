using PatientDoctorConsultation.Modules.Doctor.DTOs;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.Doctor.Interfaces;

public interface IDoctorService
{
    // ── Doctor Profile ────────────────────────────────────────────────────────
    Task<DoctorProfileResponse> CreateProfileAsync(Guid userId, CreateDoctorProfileRequest request, CancellationToken ct = default);
    Task<DoctorProfileResponse> GetMyProfileAsync(Guid userId, CancellationToken ct = default);
    Task<DoctorProfileResponse> UpdateMyProfileAsync(Guid userId, UpdateDoctorProfileRequest request, CancellationToken ct = default);

    // ── Availability Management ───────────────────────────────────────────────
    Task<AvailabilityResponse> AddAvailabilityAsync(Guid userId, CreateAvailabilityRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<AvailabilityResponse>> GetMyAvailabilityAsync(Guid userId, CancellationToken ct = default);
    Task<AvailabilityResponse> UpdateAvailabilityAsync(Guid userId, Guid slotId, UpdateAvailabilityRequest request, CancellationToken ct = default);
    Task DeleteAvailabilityAsync(Guid userId, Guid slotId, CancellationToken ct = default);

    // ── Public Discovery ──────────────────────────────────────────────────────
    Task<PaginatedResponse<DoctorPublicListItemResponse>> GetPublicDoctorsAsync(DoctorListQuery query, CancellationToken ct = default);
    Task<DoctorPublicDetailResponse> GetPublicDoctorDetailAsync(Guid doctorId, CancellationToken ct = default);
}

