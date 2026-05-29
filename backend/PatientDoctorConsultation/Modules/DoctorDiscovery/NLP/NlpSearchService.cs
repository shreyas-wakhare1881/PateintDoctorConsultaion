using System.Text.Json;
using PatientDoctorConsultation.Modules.DoctorDiscovery.DTOs;
using PatientDoctorConsultation.Modules.DoctorDiscovery.Interfaces;
using PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Fuzzy;
using PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Ranking;
using PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Semantic;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP;

/// <summary>
/// Orchestrates the full hybrid NLP search pipeline (Sprint 3+4):
///
///   1. Normalize query
///   2. Fuzzy correction (typo tolerance) → DidYouMean
///   3. Semantic enrichment (synonym/symptom expansion)
///   4. Intent parsing on the (possibly corrected) query
///   5. Merge explicit UI overrides (always win over NLP-inferred values)
///   6. Build <see cref="DoctorSearchRequest"/>
///   7. Execute via <see cref="IDoctorDiscoveryService"/> (single source of truth)
///      — for "relevance" sort: fetch a wider batch, rank in memory, slice requested page
///   8. Rank results via <see cref="ISearchRankingService"/>
///   9. Record analytics V2 (fire-safe await)
///  10. Return <see cref="NlpSearchResponse"/> with DidYouMean + FuzzyMatchApplied
///
/// DoctorDiscoveryService is NEVER bypassed.
/// </summary>
public sealed class NlpSearchService(
    IIntentParser intentParser,
    IQueryNormalizer queryNormalizer,
    IDoctorDiscoveryService discoveryService,
    ISearchAnalyticsRepository analyticsRepository,
    IFuzzySearchService fuzzySearchService,
    ISearchRankingService rankingService,
    ISemanticSearchProvider semanticProvider) : INlpSearchService
{
    private static readonly JsonSerializerOptions JsonOptions =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    // For "relevance" sort we fetch up to this many rows from the DB and rank in memory.
    private const int RelevanceBatchMax = 200;

    public async Task<NlpSearchResponse> SearchAsync(
        NlpSearchRequest request,
        Guid? patientId,
        CancellationToken ct = default)
    {
        // ── Step 1: Normalize query ────────────────────────────────────
        var normalizedQuery = queryNormalizer.Normalize(request.Query);

        // ── Step 2: Fuzzy correction (typo tolerance) ──────────────────
        var fuzzyResult     = fuzzySearchService.TryCorrect(normalizedQuery);
        var queryForParsing = fuzzyResult?.CorrectedQuery ?? normalizedQuery;
        var didYouMean      = (fuzzyResult != null && fuzzyResult.CorrectedQuery != normalizedQuery)
                                ? fuzzyResult.CorrectedQuery
                                : null;
        var fuzzyApplied    = didYouMean != null;

        // ── Step 3: Semantic enrichment ────────────────────────────────
        // Dictionary provider today; future: embedding-based provider.
        _ = await semanticProvider.EnrichQueryAsync(queryForParsing, ct);

        // ── Step 4: Parse intent ───────────────────────────────────────
        var intent = intentParser.Parse(queryForParsing);

        // ── Step 5: Merge — explicit overrides win over NLP-parsed values ──
        var mergedSpec     = request.Specialization     ?? intent.Specialization;
        var mergedCity     = request.City               ?? intent.City;
        var mergedLanguage = request.Language           ?? intent.Language;
        var mergedMaxFee   = request.MaxConsultationFee ?? intent.MaxConsultationFee;
        var mergedMinFee   = request.MinConsultationFee ?? intent.MinConsultationFee;
        var mergedMinExp   = request.MinExperience      ?? intent.MinExperience;
        var mergedMaxExp   = request.MaxExperience      ?? intent.MaxExperience;

        // ── Step 6: Build DoctorSearchRequest ─────────────────────────
        var isRelevanceSort = string.Equals(request.SortBy, "relevance", StringComparison.OrdinalIgnoreCase);
        var page     = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 50);

        var doctorRequest = new DoctorSearchRequest
        {
            SearchTerm         = string.IsNullOrWhiteSpace(intent.RemainingQuery) ? null : intent.RemainingQuery,
            Specialization     = mergedSpec,
            City               = mergedCity,
            Language           = mergedLanguage,
            MaxConsultationFee = mergedMaxFee,
            MinConsultationFee = mergedMinFee,
            MinExperience      = mergedMinExp,
            MaxExperience      = mergedMaxExp,
            SortBy             = isRelevanceSort ? "relevance" : request.SortBy,
            SortDirection      = request.SortDirection,
            // For relevance sort: fetch full batch at page 1; we'll slice after ranking
            Page               = isRelevanceSort ? 1 : page,
            PageSize           = isRelevanceSort ? RelevanceBatchMax : pageSize,
        };

        // ── Step 7: Execute search ─────────────────────────────────────
        var rawResults = await discoveryService.SearchDoctorsAsync(doctorRequest, ct);

        // ── Step 8: Rank results ───────────────────────────────────────
        var rankingContext = new SearchRankingContext(intent, intent.ConfidenceScore, request.Query);
        var rankedItems    = rankingService.Rank(rawResults.Items, rankingContext);

        PaginatedResponse<DoctorSearchResult> results;
        if (isRelevanceSort)
        {
            var skip  = (page - 1) * pageSize;
            var items = rankedItems.Skip(skip).Take(pageSize).ToList();
            results   = PaginatedResponse<DoctorSearchResult>.Create(items, rawResults.TotalCount, page, pageSize);
        }
        else
        {
            results = PaginatedResponse<DoctorSearchResult>.Create(
                rankedItems, rawResults.TotalCount, rawResults.Page, rawResults.PageSize);
        }

        // ── Step 9: Build response DTO ─────────────────────────────────
        var intentDto = BuildIntentDto(intent, mergedSpec, mergedCity, mergedLanguage,
                                       mergedMaxFee, mergedMinFee, mergedMinExp, mergedMaxExp, intent.Gender);

        var topResultId = results.Items.Count > 0 ? results.Items[0].DoctorId : (Guid?)null;

        // ── Step 10: Record analytics V2 ──────────────────────────────
        await RecordAnalyticsSafeAsync(
            query:           request.Query,
            normalizedQuery: normalizedQuery,
            intent:          intent,
            resultCount:     results.TotalCount,
            patientId:       patientId,
            topResultId:     topResultId,
            didYouMeanQuery: didYouMean,
            fuzzyApplied:    fuzzyApplied);

        return new NlpSearchResponse(results, intentDto, request.Query, didYouMean, fuzzyApplied);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private static ParsedIntentDto BuildIntentDto(
        ParsedIntent intent,
        string? spec, string? city, string? language,
        decimal? maxFee, decimal? minFee, int? minExp, int? maxExp, string? gender)
    {
        var parts = new List<string>();
        if (spec     is not null) parts.Add(spec);
        if (city     is not null) parts.Add($"in {city}");
        if (language is not null) parts.Add($"{language} speaking");
        if (maxFee   is not null) parts.Add($"fee ≤ ₹{maxFee:0}");
        if (minFee   is not null) parts.Add($"fee ≥ ₹{minFee:0}");
        if (minExp   is not null) parts.Add($"{minExp}+ years exp");
        if (gender   is not null) parts.Add(gender.ToLowerInvariant());

        var summary = parts.Count > 0 ? string.Join(", ", parts) : "Showing all doctors";

        return new ParsedIntentDto(spec, city, language, maxFee, minFee, minExp, maxExp, gender, summary,
                                   intent.ConfidenceScore);
    }

    private async Task RecordAnalyticsSafeAsync(
        string query, string normalizedQuery, ParsedIntent intent,
        int resultCount, Guid? patientId, Guid? topResultId,
        string? didYouMeanQuery, bool fuzzyApplied)
    {
        try
        {
            var intentJson = JsonSerializer.Serialize(intent, JsonOptions);
            await analyticsRepository.RecordSearchAsync(
                query:             query,
                parsedIntentJson:  intentJson,
                resultCount:       resultCount,
                searchSource:      "nlp",
                patientId:         patientId,
                normalizedQuery:   normalizedQuery,
                confidenceScore:   intent.ConfidenceScore,
                topResultId:       topResultId,
                didYouMeanQuery:   didYouMeanQuery,
                fuzzyMatchApplied: fuzzyApplied,
                ct:                CancellationToken.None);
        }
        catch
        {
            // Analytics must never crash the search response.
        }
    }
}
