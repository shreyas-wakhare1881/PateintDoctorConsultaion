namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Semantic;

/// <summary>
/// Abstraction for semantic query enrichment providers.
///
/// Implementations:
///   <see cref="DictionarySemanticSearchProvider"/> — today's default (synonym + symptom expansion)
///   EmbeddingSemanticSearchProvider              — future (pgvector + OpenAI/Claude embeddings)
///
/// Registered as Singleton in DI.
/// </summary>
public interface ISemanticSearchProvider
{
    /// <summary>Friendly name used in logging and analytics (e.g., "Dictionary", "Embedding").</summary>
    string ProviderName { get; }

    /// <summary>Whether the provider is ready to serve requests. Allows graceful fallback.</summary>
    bool IsAvailable { get; }

    /// <summary>
    /// Enriches the raw patient query with expanded medical vocabulary.
    /// Should never throw — callers rely on it being safe.
    /// Returns the input unchanged when <see cref="IsAvailable"/> is <c>false</c>.
    /// </summary>
    Task<SemanticSearchResult> EnrichQueryAsync(string query, CancellationToken ct = default);
}
