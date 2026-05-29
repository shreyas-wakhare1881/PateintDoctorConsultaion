using PatientDoctorConsultation.Modules.DoctorDiscovery.DTOs;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Ranking;

/// <summary>
/// Scores and orders a list of <see cref="DoctorSearchResult"/> by relevance to the
/// patient's search intent, producing a ranked list with populated <c>RelevanceScore</c>.
/// </summary>
public interface ISearchRankingService
{
    /// <summary>
    /// Returns a new list of doctors sorted by relevance descending.
    /// Each item in the returned list has its <c>RelevanceScore</c> set.
    /// The input list is not modified.
    /// </summary>
    IReadOnlyList<DoctorSearchResult> Rank(
        IReadOnlyList<DoctorSearchResult> doctors,
        SearchRankingContext context);
}
