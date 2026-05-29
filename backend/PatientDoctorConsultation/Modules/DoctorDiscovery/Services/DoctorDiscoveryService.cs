using PatientDoctorConsultation.Modules.DoctorDiscovery.DTOs;
using PatientDoctorConsultation.Modules.DoctorDiscovery.Interfaces;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.Services;

/// <summary>
/// Orchestrates doctor discovery:
/// - Clamps page / pageSize to safe bounds before delegating to the repository.
/// - Wraps the result in a standardised <see cref="PaginatedResponse{T}"/>.
/// Keeping this layer thin ensures the repository remains the single source of
/// query logic and can be independently tested / swapped.
/// </summary>
public sealed class DoctorDiscoveryService(IDoctorDiscoveryRepository repository) : IDoctorDiscoveryService
{
    private const int MaxPageSize = 50;
    private const int MinPageSize = 1;

    public async Task<PaginatedResponse<DoctorSearchResult>> SearchDoctorsAsync(
        DoctorSearchRequest request,
        CancellationToken ct = default)
    {
        // Clamp pagination inputs so the repository never receives out-of-range values.
        // The repository also clamps, but we do it here for the PaginatedResponse.Create call.
        var safePage     = Math.Max(1, request.Page);
        var safePageSize = Math.Clamp(request.PageSize, MinPageSize, MaxPageSize);

        var (items, totalCount) = await repository.SearchAsync(request, ct);

        return PaginatedResponse<DoctorSearchResult>.Create(items, totalCount, safePage, safePageSize);
    }

    public Task<DiscoveryFilterOptions> GetFilterOptionsAsync(CancellationToken ct = default) =>
        repository.GetFilterOptionsAsync(ct);
}
