using PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Data;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Semantic;

/// <summary>
/// Default <see cref="ISemanticSearchProvider"/> backed by the in-memory
/// <see cref="MedicalDictionary"/> (synonym + symptom expansion).
///
/// This provider expands the query by appending the canonical specialization name
/// when a synonym or symptom is found, helping downstream FTS queries find more results.
///
/// Example: "chest pain" → "chest pain Cardiology"
///
/// Registered as <see cref="ISemanticSearchProvider"/> Singleton in DI.
/// Future replacement: EmbeddingSemanticSearchProvider using pgvector embeddings.
/// </summary>
public sealed class DictionarySemanticSearchProvider : ISemanticSearchProvider
{
    public string ProviderName => "Dictionary";
    public bool IsAvailable    => true;

    public Task<SemanticSearchResult> EnrichQueryAsync(string query, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(query))
            return Task.FromResult(new SemanticSearchResult(query, null, false));

        var lower = query.ToLowerInvariant();

        // Try symptom map first (chest pain → Cardiology), then synonym map
        foreach (var (symptom, spec) in MedicalDictionary.SymptomsSortedByLengthDesc)
        {
            if (lower.Contains(symptom.ToLowerInvariant()))
            {
                var enriched = $"{query} {spec}";
                return Task.FromResult(new SemanticSearchResult(enriched, spec, true));
            }
        }

        foreach (var (synonym, spec) in MedicalDictionary.SynonymsSortedByLengthDesc)
        {
            if (lower.Contains(synonym.ToLowerInvariant()))
            {
                var enriched = $"{query} {spec}";
                return Task.FromResult(new SemanticSearchResult(enriched, spec, true));
            }
        }

        return Task.FromResult(new SemanticSearchResult(query, null, false));
    }
}
