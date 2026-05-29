namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP;

/// <summary>
/// Resolves medical synonyms to canonical specialization names.
/// Single source of truth for all synonym operations.
/// </summary>
public interface IMedicalSynonymService
{
    /// <summary>
    /// Resolves a single term to its canonical medical specialization.
    /// Returns null if the term is not recognized.
    /// </summary>
    string? Resolve(string term);

    /// <summary>
    /// Scans the free-text input, finds the first recognizable specialization synonym
    /// (matching multi-word phrases before single words), and returns:
    ///   — The canonical specialization name (null if nothing matched).
    ///   — The input text with the matched synonym removed.
    ///   — A flag indicating whether the match came from the symptom/disease map
    ///     (lower confidence) vs. the direct synonym map (higher confidence).
    ///
    /// Two-phase lookup:
    ///   1. Direct synonym map  (e.g., "heart doctor" → Cardiology)     → IsSymptomInferred = false
    ///   2. Symptom/disease map (e.g., "chest pain"   → Cardiology)     → IsSymptomInferred = true
    /// </summary>
    (string RemainingText, string? Specialization, bool IsSymptomInferred) ExtractAndResolve(string text);

    /// <summary>
    /// Returns synonym keys and canonical names that contain the given prefix/substring.
    /// Used by the auto-suggestions engine.
    /// </summary>
    IReadOnlyList<string> GetMatchingSynonymKeys(string prefix, int limit = 10);
}
