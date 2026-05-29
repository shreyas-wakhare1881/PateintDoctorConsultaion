using PatientDoctorConsultation.Modules.DoctorDiscovery.DTOs;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.Interfaces;

/// <summary>
/// Repository contract for doctor discovery queries.
/// Separated from IDoctorService to keep profile management and discovery concerns decoupled,
/// and to allow independent caching / read-replica routing in the future.
/// </summary>
public interface IDoctorDiscoveryRepository
{
    /// <summary>
    /// Returns a paginated, filtered, and sorted set of publicly visible approved doctors.
    /// </summary>
    Task<(IReadOnlyList<DoctorSearchResult> Items, int TotalCount)> SearchAsync(
        DoctorSearchRequest request,
        CancellationToken ct = default);

    /// <summary>
    /// Returns distinct filter option values sourced from actual approved+visible doctor data.
    /// Used to populate dynamic filter dropdowns — no hardcoded values.
    /// </summary>
    Task<DiscoveryFilterOptions> GetFilterOptionsAsync(CancellationToken ct = default);

    /// <summary>
    /// Returns distinct specialization names from approved+visible doctors whose
    /// <c>SpecializationNormalized</c> contains <paramref name="query"/> (case-insensitive).
    /// Used by the auto-suggestions engine as Source 3 (DB-backed suggestions).
    /// Limited to <paramref name="limit"/> results for performance.
    /// </summary>
    Task<IReadOnlyList<string>> GetDistinctSpecializationsMatchingAsync(
        string query,
        CancellationToken ct = default,
        int limit = 15);
}
