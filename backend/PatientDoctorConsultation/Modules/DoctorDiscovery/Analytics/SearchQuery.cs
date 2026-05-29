namespace PatientDoctorConsultation.Modules.DoctorDiscovery.Analytics;

/// <summary>
/// Append-only record of every patient search event.
/// Purpose: analytics, future AI training, usage pattern insights.
///
/// Not a domain entity — no business rules, no navigation properties.
/// Intentionally lean: no BaseAuditableEntity overhead.
/// </summary>
public sealed class SearchQuery
{
    public Guid Id { get; init; } = Guid.NewGuid();

    /// <summary>Null when the search was performed by an unauthenticated visitor.</summary>
    public Guid? PatientId { get; init; }

    /// <summary>Original raw query string entered by the patient. Max 1 000 chars.</summary>
    public string Query { get; init; } = string.Empty;

    /// <summary>
    /// JSON snapshot of the <see cref="NLP.ParsedIntent"/> produced by the intent parser.
    /// Stored as raw JSON so future AI systems can re-interpret it without schema migrations.
    /// </summary>
    public string? ParsedIntentJson { get; init; }

    /// <summary>Number of doctors returned for this search.</summary>
    public int ResultCount { get; init; }

    /// <summary>
    /// Origin of the search: "nlp" | "structured" | "suggestions".
    /// Allows analytics to distinguish AI-ready intent searches from plain filter searches.
    /// </summary>
    public string SearchSource { get; init; } = "nlp";

    /// <summary>UTC timestamp of the search. Indexed for time-range analytics queries.</summary>
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;

    /// <summary>
    /// Normalized (lowercase, clean) form of the original query used during NLP processing.
    /// Stored to enable deduplication, trending terms, and future ML training data.
    /// Max 1 000 chars.
    /// </summary>
    public string? NormalizedQuery { get; init; }

    /// <summary>
    /// Confidence score [0.0–1.0] assigned by the intent parser.
    /// Indicates how well the NLP engine understood the query:
    ///   0.78+ = direct synonym match; 0.55+ = symptom-inferred; 0.20 = nothing found.
    /// </summary>
    public double? ConfidenceScore { get; init; }

    // ── Analytics V2 fields (Sprint 3) ───────────────────────────────────────

    /// <summary>
    /// DoctorId of the first result returned, used for click-through analytics.
    /// Null when no results were found.
    /// </summary>
    public Guid? TopResultId { get; init; }

    /// <summary>
    /// The corrected query suggested by the fuzzy engine ("Did you mean…?").
    /// Null when no spelling correction was applied.
    /// </summary>
    public string? DidYouMeanQuery { get; init; }

    /// <summary>Whether the fuzzy corrector modified the query before searching.</summary>
    public bool FuzzyMatchApplied { get; init; }
}
