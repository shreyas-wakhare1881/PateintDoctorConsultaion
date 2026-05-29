using PatientDoctorConsultation.Infrastructure.Persistence.Context;
using PatientDoctorConsultation.Modules.DoctorDiscovery.Analytics;
using PatientDoctorConsultation.Modules.DoctorDiscovery.Interfaces;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.Repositories;

/// <summary>
/// Append-only writer for <see cref="SearchQuery"/> analytics records.
/// Never reads or modifies existing rows.
/// </summary>
public sealed class SearchAnalyticsRepository(ApplicationDbContext db) : ISearchAnalyticsRepository
{
    public async Task RecordSearchAsync(
        string query,
        string? parsedIntentJson,
        int resultCount,
        string searchSource,
        Guid? patientId = null,
        string? normalizedQuery = null,
        double? confidenceScore = null,
        Guid? topResultId = null,
        string? didYouMeanQuery = null,
        bool fuzzyMatchApplied = false,
        CancellationToken ct = default)
    {
        db.Set<SearchQuery>().Add(new SearchQuery
        {
            Query              = query,
            ParsedIntentJson   = parsedIntentJson,
            ResultCount        = resultCount,
            SearchSource       = searchSource,
            PatientId          = patientId,
            NormalizedQuery    = normalizedQuery,
            ConfidenceScore    = confidenceScore,
            TopResultId        = topResultId,
            DidYouMeanQuery    = didYouMeanQuery,
            FuzzyMatchApplied  = fuzzyMatchApplied,
        });

        await db.SaveChangesAsync(ct);
    }
}
