using PatientDoctorConsultation.Modules.DoctorDiscovery.DTOs;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.Interfaces;

/// <summary>
/// Service contract for doctor discovery. Delegates to <see cref="IDoctorDiscoveryRepository"/>
/// and applies cross-cutting concerns (page/size clamping, validation result wrapping).
/// </summary>
public interface IDoctorDiscoveryService
{
    /// <summary>
    /// Returns a paginated, filtered, and sorted list of publicly discoverable doctors.
    /// </summary>
    Task<PaginatedResponse<DoctorSearchResult>> SearchDoctorsAsync(
        DoctorSearchRequest request,
        CancellationToken ct = default);

    /// <summary>
    /// Returns dynamic filter option values (specializations, cities, languages) for UI dropdowns.
    /// All values are sourced from actual approved+visible doctor data.
    /// </summary>
    Task<DiscoveryFilterOptions> GetFilterOptionsAsync(CancellationToken ct = default);
}
