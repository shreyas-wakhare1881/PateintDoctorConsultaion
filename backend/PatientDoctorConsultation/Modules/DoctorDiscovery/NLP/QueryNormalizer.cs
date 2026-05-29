using System.Text.RegularExpressions;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP;

/// <summary>
/// Production-grade query normalization engine.
/// Phase 1 of the Intent Parser V2 pipeline — runs before any entity extraction.
///
/// Thread-safe: all Regex instances are compiled and stored as static fields.
/// Singleton-safe: no mutable state.
/// </summary>
public sealed class QueryNormalizer : IQueryNormalizer
{
    // ── Pre-compiled regex patterns (allocated once at startup) ──────────────

    /// <summary>Matches a hyphen between word characters ("skin-doctor" → "skin doctor").</summary>
    private static readonly Regex HyphenBetweenWords =
        new(@"(?<=\w)-(?=\w)", RegexOptions.Compiled);

    /// <summary>Matches any character that is NOT alphanumeric or whitespace.</summary>
    private static readonly Regex NonAlphanumericOrSpace =
        new(@"[^\w\s]", RegexOptions.Compiled);

    /// <summary>Matches two or more consecutive whitespace characters.</summary>
    private static readonly Regex MultipleSpaces =
        new(@"\s{2,}", RegexOptions.Compiled);

    // ════════════════════════════════════════════════════════════════════════
    public string Normalize(string rawQuery)
    {
        if (string.IsNullOrWhiteSpace(rawQuery))
            return string.Empty;

        var text = rawQuery.Trim();

        // ── Step 1: Case normalization → lowercase ──────────────────────────
        // All downstream regex patterns use IgnoreCase, so lowercase is safe
        // and makes matching deterministic.
        text = text.ToLowerInvariant();

        // ── Step 2: Hyphens between words → single space ────────────────────
        // "skin-doctor" → "skin doctor", "5-year" → "5 year"
        text = HyphenBetweenWords.Replace(text, " ");

        // ── Step 3: Remove remaining special characters ─────────────────────
        // Strips punctuation: !, ?, ., @, #, $, etc.
        // \w matches [a-zA-Z0-9_]; we keep letters, digits, spaces.
        // Unicode word chars (\w) also covers accented letters — desirable.
        text = NonAlphanumericOrSpace.Replace(text, " ");

        // ── Step 4: Collapse multiple whitespace → single space ─────────────
        text = MultipleSpaces.Replace(text, " ").Trim();

        return text;
    }
}
