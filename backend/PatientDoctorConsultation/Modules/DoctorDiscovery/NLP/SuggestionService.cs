using PatientDoctorConsultation.Modules.DoctorDiscovery.DTOs;
using PatientDoctorConsultation.Modules.DoctorDiscovery.Interfaces;
using PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Data;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP;

/// <summary>
/// Produces ranked auto-suggestions from three sources (priority order):
///
///   1. <see cref="MedicalDictionary.KnownSpecializations"/>   — canonical names (fastest)
///   2. Synonym keys via <see cref="IMedicalSynonymService"/>  — lay-term phrases
///   3. DB: actual doctor specializations matching the prefix  — covers non-dictionary entries
///
/// Deduplication ensures no suggestion appears twice regardless of source.
/// </summary>
public sealed class SuggestionService(
    IMedicalSynonymService synonymService,
    IDoctorDiscoveryRepository discoveryRepository) : ISuggestionService
{
    public async Task<IReadOnlyList<SearchSuggestion>> GetSuggestionsAsync(
        string query,
        int limit = 10,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
            return [];

        var q      = query.Trim();
        var seen   = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var result = new List<SearchSuggestion>(limit);

        // ── Source 1: Known canonical specializations ──────────────────
        foreach (var spec in MedicalDictionary.KnownSpecializations)
        {
            if (!spec.Contains(q, StringComparison.OrdinalIgnoreCase)) continue;
            if (!seen.Add(spec)) continue;

            result.Add(new SearchSuggestion(spec, spec, SuggestionType.Specialization));
            if (result.Count >= limit) return result;
        }

        // ── Source 1.5: Specialization via synonym resolution ──────────
        // When the prefix matches synonym keys, also surface the resolved canonical
        // specialization as Specialization type (covers "skin" → Dermatology).
        // Uses a wider scan (up to 50 keys) then deduplicates via `seen`.
        var resolvedSpecs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var key in synonymService.GetMatchingSynonymKeys(q, 50))
        {
            var canonical = synonymService.Resolve(key);
            if (canonical is not null) resolvedSpecs.Add(canonical);
        }
        foreach (var spec in resolvedSpecs)
        {
            if (result.Count >= limit) break;
            if (!seen.Add(spec)) continue;
            result.Add(new SearchSuggestion(spec, spec, SuggestionType.Specialization));
        }

        // ── Source 2: Synonym keys (lay-term phrases) ──────────────────
        var synonymKeys = synonymService.GetMatchingSynonymKeys(q, limit - result.Count);
        foreach (var key in synonymKeys)
        {
            if (!seen.Add(key)) continue;

            // Get the canonical value this synonym resolves to.
            var canonical = synonymService.Resolve(key) ?? key;
            // Display as "heart doctor → Cardiologist" for clarity.
            var displayText = string.Equals(key, canonical, StringComparison.OrdinalIgnoreCase)
                ? key
                : $"{key} → {canonical}";

            result.Add(new SearchSuggestion(displayText, key, SuggestionType.Synonym));
            if (result.Count >= limit) return result;
        }

        // ── Source 3 (V2): Symptom keys (e.g., "chest pain → Cardiology") ─
        // Only surfaced when the query prefix matches a symptom key.
        foreach (var (symptom, spec) in MedicalDictionary.SymptomToSpecialization)
        {
            if (result.Count >= limit) break;
            if (!symptom.Contains(q, StringComparison.OrdinalIgnoreCase)) continue;

            var displayText = $"For {symptom} → {spec}";
            if (!seen.Add(displayText)) continue;

            result.Add(new SearchSuggestion(displayText, symptom, SuggestionType.Symptom));
        }

        // ── Source 4: DB specializations not already covered ───────────
        if (result.Count < limit)
        {
            var dbSpecs = await discoveryRepository
                .GetDistinctSpecializationsMatchingAsync(q, ct);

            foreach (var spec in dbSpecs)
            {
                if (!seen.Add(spec)) continue;
                result.Add(new SearchSuggestion(spec, spec, SuggestionType.Specialization));
                if (result.Count >= limit) break;
            }
        }

        return result;
    }
}
