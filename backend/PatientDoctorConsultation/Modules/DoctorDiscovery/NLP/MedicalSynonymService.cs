using System.Text.RegularExpressions;
using PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Data;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP;

/// <summary>
/// Dictionary-driven synonym resolution service.
/// All vocabulary is sourced from <see cref="MedicalDictionary"/> — no logic scattered here.
///
/// Two-phase lookup in <see cref="ExtractAndResolve"/>:
///   Phase 1: Direct synonym map  (e.g., "heart doctor" → Cardiology) — HIGH confidence
///   Phase 2: Symptom/disease map (e.g., "chest pain"   → Cardiology) — MEDIUM confidence
///
/// Registered as <see cref="Microsoft.Extensions.DependencyInjection.ServiceLifetime.Singleton"/>
/// since it holds no mutable state and its data never changes at runtime.
/// </summary>
public sealed class MedicalSynonymService : IMedicalSynonymService
{
    // ── Pre-sorted synonym lists (longest key first) ─────────────────────────
    // Sorted once at startup so ExtractAndResolve always tries multi-word
    // phrases (e.g., "heart doctor") before single-word subsets (e.g., "heart").
    private static readonly IReadOnlyList<KeyValuePair<string, string>> SortedSynonyms =
        MedicalDictionary.SynonymsSortedByLengthDesc;

    private static readonly IReadOnlyList<KeyValuePair<string, string>> SortedSymptoms =
        MedicalDictionary.SymptomsSortedByLengthDesc;

    public string? Resolve(string term)
    {
        if (string.IsNullOrWhiteSpace(term)) return null;
        return MedicalDictionary.SynonymToSpecialization.TryGetValue(term.Trim(), out var canonical)
            ? canonical
            : null;
    }

    public (string RemainingText, string? Specialization, bool IsSymptomInferred) ExtractAndResolve(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return (text, null, false);

        var textLower = text.ToLowerInvariant();

        // ── Phase 1: Direct synonym map (doctor type / specialization names) ──
        foreach (var (synonym, canonical) in SortedSynonyms)
        {
            var synonymLower = synonym.ToLowerInvariant();
            if (!ContainsWholePhrase(textLower, synonymLower)) continue;

            var cleaned = RemoveWholePhrase(text, synonym);
            return (cleaned, canonical, false); // isSymptomInferred = false
        }

        // ── Phase 2: Symptom / disease map (system-inferred specialization) ───
        foreach (var (symptom, canonical) in SortedSymptoms)
        {
            var symptomLower = symptom.ToLowerInvariant();
            if (!ContainsWholePhrase(textLower, symptomLower)) continue;

            var cleaned = RemoveWholePhrase(text, symptom);
            return (cleaned, canonical, true); // isSymptomInferred = true
        }

        return (text, null, false);
    }

    public IReadOnlyList<string> GetMatchingSynonymKeys(string prefix, int limit = 10)
    {
        if (string.IsNullOrWhiteSpace(prefix)) return [];

        var p = prefix.Trim();
        return MedicalDictionary.SynonymToSpecialization
            .Keys
            .Where(k => k.Contains(p, StringComparison.OrdinalIgnoreCase))
            .OrderBy(k => k.Length)
            .Take(limit)
            .ToList();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private static bool ContainsWholePhrase(string text, string phrase)
    {
        // Multi-word phrase: check for word boundaries at start and end of match.
        var idx = text.IndexOf(phrase, StringComparison.OrdinalIgnoreCase);
        if (idx < 0) return false;

        var beforeOk = idx == 0 || !char.IsLetterOrDigit(text[idx - 1]);
        var afterIdx = idx + phrase.Length;
        var afterOk  = afterIdx >= text.Length || !char.IsLetterOrDigit(text[afterIdx]);

        return beforeOk && afterOk;
    }

    private static string RemoveWholePhrase(string text, string phrase)
    {
        // Regex-based removal preserving surrounding whitespace cleanly.
        var escaped = Regex.Escape(phrase);
        var pattern = @"(?<![a-zA-Z])" + escaped + @"(?![a-zA-Z])";
        return Regex.Replace(text, pattern, " ", RegexOptions.IgnoreCase).Trim();
    }
}

