namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Fuzzy;

/// <summary>
/// Returned by <see cref="IFuzzySearchService.TryCorrect"/> when a
/// close-enough medical-term match is found for a misspelled token.
/// </summary>
public sealed record FuzzyMatchResult(
    /// <summary>The raw query before correction.</summary>
    string OriginalQuery,
    /// <summary>The query with the misspelled token replaced by <see cref="MatchedTerm"/>.</summary>
    string CorrectedQuery,
    /// <summary>The known medical term that was matched.</summary>
    string MatchedTerm,
    /// <summary>Canonical specialization the matched term resolves to.</summary>
    string ResolvedSpecialization,
    /// <summary>Normalised similarity score [0.0 – 1.0]; higher is better.</summary>
    double Similarity
);
