namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Fuzzy;

/// <summary>
/// Typo-tolerant query corrector for medical search terms.
/// Detects misspelled specialisation/synonym tokens and returns a corrected query.
/// </summary>
public interface IFuzzySearchService
{
    /// <summary>
    /// Tries to correct misspelled tokens in <paramref name="query"/>.
    /// Returns <c>null</c> when no close match is found (the query is fine as-is).
    /// </summary>
    FuzzyMatchResult? TryCorrect(string query);
}
