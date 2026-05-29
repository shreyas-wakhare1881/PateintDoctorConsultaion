using System.Text.RegularExpressions;
using PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Data;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP;

/// <summary>
/// Deterministic NLP intent parser — Version 2.
///
/// Parsing pipeline (ORDER IS CRITICAL — each step removes matched tokens so
/// later steps work on a progressively cleaner string):
///
///   0. Query normalization   — lowercase, collapse whitespace, strip special chars
///   1. MaxFee extraction     — unambiguous: "under 500", "below ₹1000", "max 2000"
///   2. MinExperience         — MUST run BEFORE MinFee; "more than 10 years" is exp, not fee
///   3. MaxExperience         — "less than 5 years exp", "maximum 5 years"
///   4. MinFee extraction     — safe after exp consumed; negative lookahead guards "years"
///   5. Language extraction   — greedy: captures first, removes ALL language tokens
///   6. Specialization        — two-phase: direct synonyms → symptom/disease inference
///   7. Gender extraction     — "female", "lady", "male", "man"
///   8. City extraction       — whole-word match against CityAliasToCanonical
///   9. Stop-word removal     — strips noise from the remainder
///  10. Confidence scoring    — based on entities extracted + match quality
///
/// Registered as Singleton — all dependencies are stateless.
/// </summary>
public sealed class IntentParser(IMedicalSynonymService synonymService, IQueryNormalizer normalizer) : IIntentParser
{
    // ── Fee patterns ───────────────────────────────────────────────────────
    // "under 500"  |  "below ₹1000"  |  "max 2000"  |  "upto 300"
    private static readonly Regex MaxFeeRegex = new(
        @"(?:under|below|less\s+than|upto|up\s+to|maximum|max|atmost|at\s+most|not\s+more\s+than|within)\s*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // "above 500"  |  "minimum 200"  |  "starting from 300"
    // CRITICAL: negative lookahead (?!...) prevents "more than 10 years" from
    // being matched as a fee — "more than X years" belongs to MinExperiencePrefixRegex.
    private static readonly Regex MinFeeRegex = new(
        @"(?:above|more\s+than|minimum|min|atleast|at\s+least|greater\s+than|starting\s+from|starting\s+at|from)\s*(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)(?!\s*\+?\s*(?:years?|yrs?))",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // ── Experience patterns ────────────────────────────────────────────────
    // "10 years experience"  |  "5 yrs exp"  |  "15+ years"
    private static readonly Regex ExperienceRegex = new(
        @"(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|experienced|exp)?",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // "minimum 10 years"  |  "atleast 5 years"  |  "over 10 years"
    private static readonly Regex MinExperiencePrefixRegex = new(
        @"(?:minimum|min|atleast|at\s+least|more\s+than|over|above)\s*(\d+)\s*(?:years?|yrs?)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // "less than 5 years exp"  |  "maximum 3 years experience"
    private static readonly Regex MaxExperienceRegex = new(
        @"(?:less\s+than|below|under|maximum|max|upto|up\s+to)\s*(\d+)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|experienced|exp)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // ── Gender keywords ────────────────────────────────────────────────────
    private static readonly HashSet<string> FemaleWords =
        new(StringComparer.OrdinalIgnoreCase) { "female", "lady", "woman", "women" };

    private static readonly HashSet<string> MaleWords =
        new(StringComparer.OrdinalIgnoreCase) { "male", "man" };

    // ── Stop words removed from remainder ─────────────────────────────────
    private static readonly HashSet<string> StopWords =
        new(StringComparer.OrdinalIgnoreCase)
        {
            // Articles, prepositions, conjunctions
            "a", "an", "the", "in", "at", "on", "of", "for", "with", "to", "by",
            "from", "about", "like", "just", "only", "some", "any", "all",
            // Pronouns and common verbs
            "is", "are", "was", "were", "me", "my", "i", "he", "she", "they",
            "has", "have", "having", "need", "needs", "want", "wants", "can",
            "and", "or", "who", "that", "this", "which", "where", "what",
            // Action / search words
            "find", "show", "get", "book", "please", "help", "looking", "check",
            // Descriptive / quality words
            "near", "nearby", "area", "around", "here", "there",
            "good", "best", "top", "cheap", "affordable", "nearest",
            // Medical role words (consumed by synonym engine but may linger)
            "dr", "doctor", "specialist", "physician", "expert",
            // Language qualifiers (consumed by language step but may linger)
            "speaking", "speaks", "spoken",
            // Fee / cost noise words — critical: prevents "charges" from becoming SearchTerm
            "charges", "charge", "fee", "fees", "cost", "costs", "costing",
            "priced", "pricing", "amount", "pay", "paying",
            // Symptom context words that add no search value after spec is extracted
            "suffering", "suffer", "pain", "ache", "problem",
            // Miscellaneous noise
            "more", "less", "between",
        };

    // ── Cities sorted longest-first for greedy matching ───────────────────
    private static readonly IReadOnlyList<KeyValuePair<string, string>> SortedCityAliases =
        [.. MedicalDictionary.CityAliasToCanonical.OrderByDescending(kv => kv.Key.Length)];

    // ══════════════════════════════════════════════════════════════════════
    public ParsedIntent Parse(string rawQuery)
    {
        if (string.IsNullOrWhiteSpace(rawQuery))
            return new ParsedIntent { ConfidenceScore = 0.10 };

        // ── Step 0: Query normalization ─────────────────────────────────
        // Lowercase, collapse whitespace, strip special chars.
        // The normalized form is used for all downstream extractions.
        var text = normalizer.Normalize(rawQuery);

        if (string.IsNullOrWhiteSpace(text))
            return new ParsedIntent { ConfidenceScore = 0.10 };

        decimal? maxFee           = null;
        decimal? minFee           = null;
        int?     minExp           = null;
        int?     maxExp           = null;
        string?  language         = null;
        string?  gender           = null;
        string?  spec             = null;
        string?  city             = null;
        bool     isSymptomInferred = false;

        // ── Step 1: MaxFee ───────────────────────────────────────────────
        // Patterns: "under 500", "below ₹1000", "max 2000"
        // These are unambiguous — no risk of conflict with experience patterns.
        var maxFeeMatch = MaxFeeRegex.Match(text);
        if (maxFeeMatch.Success && decimal.TryParse(maxFeeMatch.Groups[1].Value, out var mxf))
        {
            maxFee = mxf;
            text   = MaxFeeRegex.Replace(text, " ").Trim();
        }

        // ── Step 2: MinExperience ── MUST run BEFORE MinFee ─────────────
        // Root cause fix: "more than 10 years" contains "more than" which also
        // appears in MinFeeRegex. By extracting experience first, we safely
        // consume "more than 10 years" before MinFee can misinterpret it.
        var minExpPrefix = MinExperiencePrefixRegex.Match(text);
        if (minExpPrefix.Success && int.TryParse(minExpPrefix.Groups[1].Value, out var mne))
        {
            minExp = mne;
            text   = MinExperiencePrefixRegex.Replace(text, " ").Trim();
        }
        else
        {
            var expMatch = ExperienceRegex.Match(text);
            if (expMatch.Success && int.TryParse(expMatch.Groups[1].Value, out var expYrs))
            {
                minExp = expYrs;
                text   = ExperienceRegex.Replace(text, " ").Trim();
            }
        }

        // ── Step 3: MaxExperience ────────────────────────────────────────
        // "less than 5 years experience" | "max 3 years exp"
        var maxExpMatch = MaxExperienceRegex.Match(text);
        if (maxExpMatch.Success && int.TryParse(maxExpMatch.Groups[1].Value, out var mxe))
        {
            maxExp = mxe;
            text   = MaxExperienceRegex.Replace(text, " ").Trim();
        }

        // ── Step 4: MinFee ── safe after experience is extracted ─────────
        // Negative lookahead in MinFeeRegex ensures "more than 10 years"
        // (if somehow not caught by Step 2) still won't match here.
        var minFeeMatch = MinFeeRegex.Match(text);
        if (minFeeMatch.Success && decimal.TryParse(minFeeMatch.Groups[1].Value, out var mnf))
        {
            minFee = mnf;
            text   = MinFeeRegex.Replace(text, " ").Trim();
        }

        // ── Step 5: Language (greedy — capture earliest by position, remove ALL) ───
        // "speaking hindi and english" → language=Hindi (earliest position wins),
        // "english" also removed so it doesn't pollute RemainingQuery.
        string? capturedLanguage = null;
        int capturedPosition = int.MaxValue;
        foreach (var lang in MedicalDictionary.KnownLanguages.OrderByDescending(l => l.Length))
        {
            var idx = text.IndexOf(lang.ToLowerInvariant(), StringComparison.Ordinal);
            if (idx < 0) continue;
            if (idx < capturedPosition)
            {
                capturedLanguage = lang;
                capturedPosition = idx;
            }
            text = RemoveWholeWord(text, lang); // Remove ALL language tokens
        }
        language = capturedLanguage;

        if (language != null)
        {
            // Remove language qualifier words (may appear even without a match)
            text = RemoveWholeWord(text, "speaking");
            text = RemoveWholeWord(text, "speaks");
            text = RemoveWholeWord(text, "spoken");
        }

        // ── Step 6: Specialization (two-phase: synonym → symptom) ────────
        // Must run BEFORE gender so "women doctor" → Gynecology, not gender=Female.
        (text, spec, isSymptomInferred) = synonymService.ExtractAndResolve(text);

        // ── Step 7: Gender ──────────────────────────────────────────────
        foreach (var w in FemaleWords)
        {
            if (!ContainsWholeWord(text, w)) continue;
            gender = "Female";
            text   = RemoveWholeWord(text, w);
            break;
        }

        if (gender is null)
        {
            foreach (var w in MaleWords)
            {
                if (!ContainsWholeWord(text, w)) continue;
                gender = "Male";
                text   = RemoveWholeWord(text, w);
                break;
            }
        }

        // ── Step 8: City ────────────────────────────────────────────────
        var textLower = text.ToLowerInvariant();
        foreach (var (alias, canonical) in SortedCityAliases)
        {
            if (!ContainsWholeWord(textLower, alias.ToLowerInvariant())) continue;
            city = canonical;
            text = RemoveWholeWord(text, alias); // Remove from working text
            break;
        }

        // ── Step 9: Clean remainder ─────────────────────────────────────
        var remaining = CleanRemainder(text);

        // ── Step 10: Confidence scoring ─────────────────────────────────
        var confidence = CalculateConfidence(spec, isSymptomInferred, city, language,
                                              maxFee, minFee, minExp, maxExp, gender);

        return new ParsedIntent
        {
            Specialization     = spec,
            City               = city,
            Language           = language,
            MaxConsultationFee = maxFee,
            MinConsultationFee = minFee,
            MinExperience      = minExp,
            MaxExperience      = maxExp,
            Gender             = gender,
            RemainingQuery     = string.IsNullOrWhiteSpace(remaining) ? null : remaining.Trim(),
            ConfidenceScore    = confidence,
        };
    }

    // ── Confidence model ───────────────────────────────────────────────────

    /// <summary>
    /// Calculates a confidence score [0.0–0.98] for how well the query was understood.
    ///
    /// Model:
    ///   — spec via direct synonym : +0.78 (user explicitly stated doctor type)
    ///   — spec via symptom         : +0.55 (inferred from described symptom)
    ///   — city found               : +0.12
    ///   — language found           : +0.07
    ///   — fee constraints found    : +0.06
    ///   — experience found         : +0.06
    ///   — gender found             : +0.04
    ///   — no entities at all       : 0.20 (fallback)
    /// </summary>
    private static double CalculateConfidence(
        string? spec, bool isSymptomInferred,
        string? city, string? language,
        decimal? maxFee, decimal? minFee,
        int? minExp, int? maxExp, string? gender)
    {
        bool hasAny = spec != null || city != null || language != null ||
                      maxFee != null || minFee != null || minExp != null ||
                      maxExp != null || gender != null;

        if (!hasAny) return 0.20;

        double score = 0.0;

        // Primary signal: specialization
        if (spec != null)
            score += isSymptomInferred ? 0.55 : 0.78;

        // Supporting signals
        if (city     != null) score += 0.12;
        if (language != null) score += 0.07;
        if (maxFee   != null || minFee != null) score += 0.06;
        if (minExp   != null || maxExp != null) score += 0.06;
        if (gender   != null) score += 0.04;

        // If only supporting signals without spec — cap at medium confidence
        if (spec == null && score > 0)
            score = Math.Min(score, 0.45);

        return Math.Min(Math.Round(score, 2), 0.98);
    }

    // ── Internal helpers ───────────────────────────────────────────────────

    private static bool ContainsWholeWord(string text, string word)
    {
        if (string.IsNullOrEmpty(word)) return false;
        var escaped = Regex.Escape(word);
        // \b works for single words; for multi-word phrases use boundary chars.
        var pattern = word.Contains(' ')
            ? @"(?<![a-zA-Z])" + escaped + @"(?![a-zA-Z])"
            : @"\b" + escaped + @"\b";
        return Regex.IsMatch(text, pattern, RegexOptions.IgnoreCase);
    }

    private static string RemoveWholeWord(string text, string word)
    {
        if (string.IsNullOrEmpty(word)) return text;
        var escaped = Regex.Escape(word);
        var pattern = word.Contains(' ')
            ? @"(?<![a-zA-Z])" + escaped + @"(?![a-zA-Z])"
            : @"\b" + escaped + @"\b";
        return Regex.Replace(text, pattern, " ", RegexOptions.IgnoreCase).Trim();
    }

    private static string CleanRemainder(string text)
    {
        var tokens = text.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var meaningful = tokens
            .Where(t => t.Length > 1 && !StopWords.Contains(t))
            .ToArray();
        return string.Join(" ", meaningful);
    }
}
