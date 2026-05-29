using PatientDoctorConsultation.Modules.DoctorDiscovery.DTOs;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP;

/// <summary>
/// Generates auto-complete suggestions for the patient search box.
/// Combines in-memory vocabulary (fast, no DB) with live DB specialization data.
/// </summary>
public interface ISuggestionService
{
    /// <summary>
    /// Returns up to <paramref name="limit"/> suggestions matching the given prefix/substring.
    /// Sources: MedicalDictionary specializations, synonyms, and actual DB specializations.
    /// Returns an empty list when <paramref name="query"/> is fewer than 2 characters.
    /// </summary>
    Task<IReadOnlyList<SearchSuggestion>> GetSuggestionsAsync(
        string query,
        int limit = 10,
        CancellationToken ct = default);
}
