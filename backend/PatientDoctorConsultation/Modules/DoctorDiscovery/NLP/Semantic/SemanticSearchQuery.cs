namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Semantic;

/// <summary>Input model for semantic query enrichment.</summary>
public sealed record SemanticSearchQuery(
    /// <summary>The raw or normalised patient query.</summary>
    string Query,
    /// <summary>Optional cancellation support for async providers.</summary>
    CancellationToken CancellationToken = default
);
