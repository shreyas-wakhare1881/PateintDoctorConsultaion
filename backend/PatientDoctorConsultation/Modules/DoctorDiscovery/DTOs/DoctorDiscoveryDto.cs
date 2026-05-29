using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.DTOs;

// ════════════════════════════════════════════════════════════════════════════
// REQUEST  — rich filter / sort / paginate model for doctor discovery
// ════════════════════════════════════════════════════════════════════════════

/// <summary>
/// Query model for public doctor discovery (GET /api/discovery/doctors).
/// All filter fields are optional — omitting a field means "no filter on that dimension".
/// </summary>
public sealed class DoctorSearchRequest
{
    /// <summary>
    /// Free-text term searched across FullName, Specialization, City, and HospitalName.
    /// Reserved for future NLP/semantic search; current implementation does
    /// case-insensitive substring matching.
    /// </summary>
    public string? SearchTerm { get; init; }

    /// <summary>Filter by specialization (case-insensitive exact match on normalized column).</summary>
    public string? Specialization { get; init; }

    /// <summary>Filter by city (case-insensitive exact match on normalized column).</summary>
    public string? City { get; init; }

    /// <summary>Filter by state (case-insensitive substring match).</summary>
    public string? State { get; init; }

    /// <summary>Filter by spoken language (case-insensitive, any element of LanguagesSpoken array).</summary>
    public string? Language { get; init; }

    /// <summary>Minimum years of experience (inclusive).</summary>
    public int? MinExperience { get; init; }

    /// <summary>Maximum years of experience (inclusive).</summary>
    public int? MaxExperience { get; init; }

    /// <summary>Minimum consultation fee (inclusive).</summary>
    public decimal? MinConsultationFee { get; init; }

    /// <summary>Maximum consultation fee (inclusive).</summary>
    public decimal? MaxConsultationFee { get; init; }

    /// <summary>
    /// Field to sort by. Allowed values: "fee", "experience", "rating", "name", "relevance".
    /// "relevance" is only meaningful for NLP searches; falls back to "name" for structured searches.
    /// Defaults to "name" when not specified.
    /// </summary>
    public string? SortBy { get; init; }

    /// <summary>Sort direction: "asc" (default) or "desc".</summary>
    public string SortDirection { get; init; } = "asc";

    /// <summary>1-based page number. Defaults to 1.</summary>
    public int Page { get; init; } = 1;

    /// <summary>Page size. Clamped to [1, 50] by the service layer. Default 12.</summary>
    public int PageSize { get; init; } = 12;
}

// ════════════════════════════════════════════════════════════════════════════
// RESPONSE  — projection DTO returned to the client
// ════════════════════════════════════════════════════════════════════════════

/// <summary>
/// Projection of a Doctor row as returned by the discovery endpoint.
/// Contains all fields needed for a patient-facing doctor card and detail preview.
/// </summary>
public sealed record DoctorSearchResult(
    Guid DoctorId,
    string FullName,
    string? Specialization,
    string? Qualification,
    int? ExperienceYears,
    decimal? ConsultationFee,
    decimal? Rating,
    int TotalReviews,
    string? HospitalName,
    string? City,
    string? State,
    string? Country,
    IReadOnlyList<string> LanguagesSpoken,
    string? ProfileImageUrl,
    bool IsPubliclyVisible
)
{
    /// <summary>
    /// Relevance score [0.0–1.0+] populated by <see cref="NLP.Ranking.SearchRankingService"/>.
    /// Null for structured (non-NLP) searches.
    /// </summary>
    public double? RelevanceScore { get; init; }
}

// ════════════════════════════════════════════════════════════════════════════
// FILTER OPTIONS  — dynamic dropdown values sourced from actual doctor data
// ════════════════════════════════════════════════════════════════════════════

/// <summary>
/// Dynamic filter options for the discovery search UI.
/// All values come from actual approved+visible doctor data — never hardcoded.
/// </summary>
public sealed record DiscoveryFilterOptions(
    IReadOnlyList<string> Specializations,
    IReadOnlyList<string> Cities,
    IReadOnlyList<string> Languages
);

// ════════════════════════════════════════════════════════════════════════════
// NLP SEARCH  — request / response / intent summary DTOs
// ════════════════════════════════════════════════════════════════════════════

/// <summary>
/// Request model for GET /api/discovery/nlp-search.
/// The <c>Query</c> field is the raw natural-language patient input.
///
/// Optional override fields let the frontend merge explicit dropdown filter
/// selections with the NLP query. Explicit values always win over NLP-inferred values.
/// </summary>
public sealed class NlpSearchRequest
{
    /// <summary>Free-text natural language query (e.g., "heart doctor in pune under 1000").</summary>
    public string Query { get; init; } = string.Empty;

    // ── Explicit overrides (take priority over NLP-parsed values) ──────────
    /// <summary>Explicit specialization override from UI dropdown.</summary>
    public string? Specialization { get; init; }

    /// <summary>Explicit city override from UI dropdown.</summary>
    public string? City { get; init; }

    /// <summary>Explicit language override from UI dropdown.</summary>
    public string? Language { get; init; }

    /// <summary>Explicit maximum fee override from UI dropdown.</summary>
    public decimal? MaxConsultationFee { get; init; }

    /// <summary>Explicit minimum fee override from UI dropdown.</summary>
    public decimal? MinConsultationFee { get; init; }

    /// <summary>Explicit minimum experience override from UI dropdown.</summary>
    public int? MinExperience { get; init; }

    /// <summary>Explicit maximum experience override from UI dropdown.</summary>
    public int? MaxExperience { get; init; }

    // ── Pagination & sort (mirrors DoctorSearchRequest) ─────────────────────
    public string? SortBy        { get; init; }
    public string  SortDirection { get; init; } = "asc";
    public int     Page          { get; init; } = 1;
    public int     PageSize      { get; init; } = 12;
}

/// <summary>
/// Public-facing summary of what the intent parser extracted from a query.
/// Returned inside <see cref="NlpSearchResponse"/> so the UI can show
/// "Searching as: Cardiologist in Mumbai, fee ≤ ₹1000".
/// </summary>
public sealed record ParsedIntentDto(
    string? Specialization,
    string? City,
    string? Language,
    decimal? MaxConsultationFee,
    decimal? MinConsultationFee,
    int? MinExperience,
    int? MaxExperience,
    string? Gender,
    /// <summary>Human-readable summary for UI display.</summary>
    string Summary,
    /// <summary>
    /// Confidence score [0.0–1.0] indicating how well the NLP engine understood the query.
    /// 0.78+ = direct synonym match; 0.55+ = symptom-inferred; 0.20 = nothing found.
    /// </summary>
    double ConfidenceScore
);

/// <summary>
/// Response from GET /api/discovery/nlp-search.
/// Wraps the paginated doctor results alongside the parsed intent summary
/// so the frontend can show what the NLP pipeline understood from the query.
/// </summary>
public sealed record NlpSearchResponse(
    PaginatedResponse<DoctorSearchResult> Results,
    ParsedIntentDto ParsedIntent,
    string OriginalQuery,
    /// <summary>
    /// Spelling correction suggestion for the original query, or null when no correction was needed.
    /// Shown as a dismissable "Did you mean…?" banner in the UI.
    /// </summary>
    string? DidYouMean = null,
    /// <summary>Whether the fuzzy corrector modified the query before searching.</summary>
    bool FuzzyMatchApplied = false
);

// ════════════════════════════════════════════════════════════════════════════
// SUGGESTIONS  — auto-complete suggestions for the search box
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Categorizes the origin of a suggestion for UI display and analytics.</summary>
public enum SuggestionType
{
    /// <summary>A canonical medical specialization name (e.g., "Cardiologist").</summary>
    Specialization,
    /// <summary>A patient-language synonym that resolves to a specialization (e.g., "heart doctor").</summary>
    Synonym,
    /// <summary>A symptom or disease that maps to a specialization (e.g., "chest pain → Cardiologist").</summary>
    Symptom,
}

/// <summary>
/// A single auto-suggestion returned by GET /api/discovery/suggestions.
/// </summary>
public sealed record SearchSuggestion(
    /// <summary>Display text shown in the dropdown (e.g., "Heart Doctor → Cardiologist").</summary>
    string Text,
    /// <summary>Value that populates the search box or NLP query when selected.</summary>
    string CanonicalValue,
    SuggestionType Type
);
