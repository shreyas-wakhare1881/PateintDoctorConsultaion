namespace PatientDoctorConsultation.Modules.DoctorDiscovery.Interfaces;

/// <summary>
/// Persists search analytics events.
/// Writes are append-only — no updates, no deletes.
/// </summary>
public interface ISearchAnalyticsRepository
{
    /// <summary>
    /// Records a search event asynchronously.
    /// Should be called with <see cref="CancellationToken.None"/> so the write
    /// is not cancelled when the HTTP request completes.
    /// </summary>
    Task RecordSearchAsync(
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
        CancellationToken ct = default);
}
