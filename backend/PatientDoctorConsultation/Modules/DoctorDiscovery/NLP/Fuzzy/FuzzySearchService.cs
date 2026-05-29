using PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Data;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Fuzzy;

/// <summary>
/// Typo-tolerant medical term corrector backed by Levenshtein edit distance.
///
/// Correction thresholds (per token):
///   token length 4–6  → edit distance ≤ 1
///   token length 7–9  → edit distance ≤ 2
///   token length 10+  → edit distance ≤ 3
///
/// Known common medical misspellings are fast-pathed before the full distance scan.
/// The search vocabulary is built once at startup from <see cref="MedicalDictionary"/>.
///
/// Registered as <see cref="IFuzzySearchService"/> Singleton in DI.
/// </summary>
public sealed class FuzzySearchService : IFuzzySearchService
{
    // Pre-built: (lowerTerm → canonicalSpecialization) for all synonym keys
    // + specialization names themselves.
    private readonly IReadOnlyList<(string Term, string Specialization)> _vocabulary;

    // Common medical misspellings: misspelled token (lower) → correct token (lower)
    private static readonly Dictionary<string, string> _quickCorrections =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["cardiolgist"]     = "cardiologist",
            ["cardiolgists"]    = "cardiologists",
            ["cardioligist"]    = "cardiologist",
            ["dermatolgist"]    = "dermatologist",
            ["dermatolgists"]   = "dermatologists",
            ["dermatolgoy"]     = "dermatology",
            ["opthalmologist"]  = "ophthalmologist",
            ["opthamologist"]   = "ophthalmologist",
            ["opthmologist"]    = "ophthalmologist",
            ["opthalmology"]    = "ophthalmology",
            ["nuorologist"]     = "neurologist",
            ["neurologyst"]     = "neurologist",
            ["nuerologist"]     = "neurologist",
            ["peditrician"]     = "pediatrician",
            ["peadiatrician"]   = "paediatrician",
            ["pedatrician"]     = "pediatrician",
            ["psyciatrist"]     = "psychiatrist",
            ["psycologist"]     = "psychiatrist",
            ["gynacologist"]    = "gynecologist",
            ["gynaeclogist"]    = "gynaecologist",
            ["orthopedian"]     = "orthopedic",
            ["orthopaedian"]    = "orthopaedic",
            ["gasterologist"]   = "gastroenterologist",
            ["gastroligist"]    = "gastroenterologist",
            ["pulmonlogist"]    = "pulmonologist",
            ["nefhrologist"]    = "nephrologist",
            ["onkologist"]      = "oncologist",
            ["urologyst"]       = "urologist",
            ["endocrinlogist"]  = "endocrinologist",
            ["diabetlogist"]    = "diabetologist",
        };

    public FuzzySearchService()
    {
        // Build vocabulary once: single-word synonym keys + KnownSpecializations.
        // Multi-word phrases (e.g., "heart doctor") are handled by IntentParser directly;
        // fuzzy correction operates at the single-token level.
        var vocab = new List<(string, string)>();

        foreach (var (key, spec) in MedicalDictionary.SynonymToSpecialization)
        {
            if (!key.Contains(' ')) // single-word only
                vocab.Add((key.ToLowerInvariant(), spec));
        }

        foreach (var spec in MedicalDictionary.KnownSpecializations)
        {
            var lower = spec.ToLowerInvariant();
            if (!vocab.Any(v => v.Item1 == lower))
                vocab.Add((lower, spec));
        }

        _vocabulary = vocab;
    }

    /// <inheritdoc />
    public FuzzyMatchResult? TryCorrect(string query)
    {
        if (string.IsNullOrWhiteSpace(query)) return null;

        // Split into tokens; only process tokens with length ≥ 4 that are not stop words.
        var tokens = query.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (tokens.Length == 0) return null;

        foreach (var token in tokens)
        {
            var lower = token.ToLowerInvariant();
            if (lower.Length < 4) continue;

            // 1. Quick-path: known misspellings
            if (_quickCorrections.TryGetValue(lower, out var fastCorrection))
            {
                // Look up the corrected token in vocabulary
                var vocabEntry = _vocabulary.FirstOrDefault(v => v.Term.Equals(fastCorrection, StringComparison.OrdinalIgnoreCase));
                if (vocabEntry != default)
                {
                    var corrected = ReplaceToken(query, token, vocabEntry.Term);
                    return new FuzzyMatchResult(query, corrected, vocabEntry.Term, vocabEntry.Specialization, 0.95);
                }
            }

            // 2. Levenshtein scan
            int threshold = lower.Length switch
            {
                >= 10 => 3,
                >= 7  => 2,
                >= 4  => 1,
                _     => 0,
            };

            if (threshold == 0) continue;

            FuzzyMatchResult? best = null;
            int bestDist = threshold + 1;

            foreach (var (term, spec) in _vocabulary)
            {
                // Skip if length difference alone exceeds threshold (pruning)
                if (Math.Abs(lower.Length - term.Length) > threshold) continue;

                int dist = ComputeLevenshtein(lower, term);
                if (dist > 0 && dist <= threshold && dist < bestDist)
                {
                    bestDist = dist;
                    var similarity = 1.0 - (double)dist / Math.Max(lower.Length, term.Length);
                    var corrected = ReplaceToken(query, token, term);
                    best = new FuzzyMatchResult(query, corrected, term, spec, similarity);

                    if (dist == 1) break; // Can't do better for this threshold
                }
            }

            if (best != null) return best;
        }

        return null;
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /// <summary>
    /// Replaces the first case-insensitive occurrence of <paramref name="original"/> token
    /// with <paramref name="replacement"/> in <paramref name="query"/>.
    /// </summary>
    private static string ReplaceToken(string query, string original, string replacement)
    {
        int idx = query.IndexOf(original, StringComparison.OrdinalIgnoreCase);
        if (idx < 0) return query;
        return string.Concat(query.AsSpan(0, idx), replacement, query.AsSpan(idx + original.Length));
    }

    /// <summary>
    /// Computes Levenshtein edit distance between <paramref name="a"/> and <paramref name="b"/>.
    /// Uses the optimised two-row DP approach: O(m*n) time, O(min(m,n)) space.
    /// </summary>
    internal static int ComputeLevenshtein(string a, string b)
    {
        if (a.Length == 0) return b.Length;
        if (b.Length == 0) return a.Length;

        // Ensure 'a' is the shorter string for space optimisation
        if (a.Length > b.Length) (a, b) = (b, a);

        var previous = new int[a.Length + 1];
        var current  = new int[a.Length + 1];

        for (int i = 0; i <= a.Length; i++) previous[i] = i;

        for (int j = 1; j <= b.Length; j++)
        {
            current[0] = j;
            for (int i = 1; i <= a.Length; i++)
            {
                int cost = a[i - 1] == b[j - 1] ? 0 : 1;
                current[i] = Math.Min(
                    Math.Min(previous[i] + 1, current[i - 1] + 1),
                    previous[i - 1] + cost);
            }
            (previous, current) = (current, previous);
        }

        return previous[a.Length];
    }
}
