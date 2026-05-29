using PatientDoctorConsultation.Modules.DoctorDiscovery.DTOs;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Ranking;

/// <summary>
/// Multi-signal relevance ranker for NLP-based doctor search results.
///
/// Scoring model (weights sum to ≤ 1.0):
///   Specialization match   +0.40   (highest weight — most important filter)
///   City match             +0.20   (proximity is key for patients)
///   Language match         +0.10   (communication preference)
///   Experience             +0.05   (capped contribution, not linear)
///   Fee (in budget)        +0.05   (more important when fee filter was applied)
///   Profile completeness   +0.10   (photo + qualification + hospital = complete)
///   Rating bonus           +0.05 * (rating / 5)
///   Review volume bonus    +0.05 * min(totalReviews / 100, 1)
///   NLP confidence bonus   +0.05 * confidenceScore
///
/// Total possible: ~1.05 (intentionally allows slight over-score for high-quality complete profiles)
/// Stored as-is in RelevanceScore [0.0 – 1.0+].
///
/// Registered as <see cref="ISearchRankingService"/> Singleton in DI.
/// </summary>
public sealed class SearchRankingService : ISearchRankingService
{
    /// <inheritdoc />
    public IReadOnlyList<DoctorSearchResult> Rank(
        IReadOnlyList<DoctorSearchResult> doctors,
        SearchRankingContext context)
    {
        if (doctors.Count == 0) return doctors;

        var intent     = context.Intent;
        var confidence = context.ConfidenceScore;

        // Normalise intent values for case-insensitive comparison once.
        var specNorm  = intent?.Specialization?.Trim().ToLowerInvariant();
        var cityNorm  = intent?.City?.Trim().ToLowerInvariant();
        var langNorm  = intent?.Language?.Trim().ToLowerInvariant();
        var maxFee    = intent?.MaxConsultationFee;
        var minExp    = intent?.MinExperience;

        return doctors
            .Select(d => Score(d, specNorm, cityNorm, langNorm, maxFee, minExp, confidence))
            .OrderByDescending(x => x.RelevanceScore)
            .ThenByDescending(x => x.Rating ?? 0)
            .ToList();
    }

    // ── Private scorer ────────────────────────────────────────────────────

    private static DoctorSearchResult Score(
        DoctorSearchResult d,
        string? specNorm,
        string? cityNorm,
        string? langNorm,
        decimal? maxFee,
        int? minExp,
        double confidence)
    {
        double score = 0;

        // Specialization match (+0.40)
        if (specNorm != null)
        {
            var dSpecNorm = d.Specialization?.Trim().ToLowerInvariant();
            if (dSpecNorm != null && dSpecNorm.Contains(specNorm))
                score += 0.40;
        }

        // City match (+0.20)
        if (cityNorm != null)
        {
            var dCityNorm = d.City?.Trim().ToLowerInvariant();
            if (dCityNorm != null && dCityNorm.Contains(cityNorm))
                score += 0.20;
        }

        // Language match (+0.10)
        if (langNorm != null && d.LanguagesSpoken.Any(l => l.Trim().ToLowerInvariant() == langNorm))
            score += 0.10;

        // Experience (+0.05) — reward doctors meeting or exceeding the minimum experience asked
        if (minExp.HasValue && d.ExperienceYears.HasValue && d.ExperienceYears >= minExp.Value)
            score += 0.05;

        // Fee in budget (+0.05)
        if (maxFee.HasValue && d.ConsultationFee.HasValue && d.ConsultationFee <= maxFee.Value)
            score += 0.05;

        // Profile completeness (+0.10)
        // A complete profile = has photo + has qualification + has hospital name.
        double completeness = 0;
        if (!string.IsNullOrWhiteSpace(d.ProfileImageUrl))  completeness += 1.0 / 3;
        if (!string.IsNullOrWhiteSpace(d.Qualification))    completeness += 1.0 / 3;
        if (!string.IsNullOrWhiteSpace(d.HospitalName))     completeness += 1.0 / 3;
        score += 0.10 * completeness;

        // Rating bonus (+0.05)
        if (d.Rating.HasValue)
            score += 0.05 * (double)(d.Rating.Value / 5m);

        // Review volume bonus (+0.05)
        score += 0.05 * Math.Min(d.TotalReviews / 100.0, 1.0);

        // NLP confidence bonus (+0.05)
        score += 0.05 * confidence;

        return d with { RelevanceScore = score };
    }
}
