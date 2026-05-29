namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Semantic;

/// <summary>Output from a semantic enrichment provider.</summary>
public sealed record SemanticSearchResult(
    /// <summary>The enriched / expanded query to pass downstream.</summary>
    string EnrichedQuery,
    /// <summary>Optional resolved specialization (if the provider identified one).</summary>
    string? ResolvedSpecialization,
    /// <summary>Whether the provider performed any meaningful enrichment.</summary>
    bool WasEnriched
);
