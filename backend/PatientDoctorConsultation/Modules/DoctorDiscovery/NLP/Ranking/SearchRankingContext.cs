using PatientDoctorConsultation.Modules.DoctorDiscovery.DTOs;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Ranking;

/// <summary>
/// Context passed to <see cref="ISearchRankingService"/> so that the scorer
/// knows what the patient was looking for and can weight matches accordingly.
/// </summary>
public sealed record SearchRankingContext(
    /// <summary>Full parsed intent from the NLP pipeline. Null for raw-text searches.</summary>
    ParsedIntent? Intent,
    /// <summary>Confidence score from the intent parser [0.0–1.0].</summary>
    double ConfidenceScore,
    /// <summary>Original raw query typed by the patient.</summary>
    string? OriginalQuery
);
