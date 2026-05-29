using Microsoft.EntityFrameworkCore;
using PatientDoctorConsultation.Infrastructure.Persistence.Context;
using PatientDoctorConsultation.Modules.Auth.Models;
using PatientDoctorConsultation.Modules.DoctorDiscovery.DTOs;
using PatientDoctorConsultation.Modules.DoctorDiscovery.Interfaces;
using PatientDoctorConsultation.Shared.Enums;
using DoctorModel = PatientDoctorConsultation.Modules.Doctor.Models.Doctor;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.Repositories;

/// <summary>
/// Implements doctor discovery queries using composable IQueryable&lt;T&gt; pipelines.
/// Each filter is only appended when the corresponding request parameter is non-null/non-empty,
/// allowing the DB to execute a single efficient query with only the WHERE clauses needed.
///
/// Eligibility gate: IsPubliclyVisible = true AND ApprovalStatus = Approved.
/// This is the single authoritative predicate — never bypassed, never duplicated.
///
/// Normalization: Specialization and City use the pre-stored *Normalized columns
/// (lowercase, trimmed) so the WHERE clause hits the B-tree index without LOWER() overhead.
/// Other text fields (State, HospitalName, SearchTerm) still use LOWER() at query time
/// since they have no normalized companion column.
/// </summary>
public sealed class DoctorDiscoveryRepository(ApplicationDbContext db) : IDoctorDiscoveryRepository
{
    // Sort field names accepted from clients; mapped to EF expressions.
    // "relevance" is accepted here but handled by SearchRankingService in NlpSearchService —
    // the repository falls back to "name" sort so the DB returns a stable base set.
    private static readonly HashSet<string> AllowedSortFields =
        new(StringComparer.OrdinalIgnoreCase) { "fee", "experience", "rating", "name", "relevance" };

    public async Task<(IReadOnlyList<DoctorSearchResult> Items, int TotalCount)> SearchAsync(
        DoctorSearchRequest request,
        CancellationToken ct = default)
    {
        // ── Base join + eligibility gate ──────────────────────────────────
        // Single source of truth: only approved + publicly visible doctors are ever returned.
        var query =
            from d in db.Set<DoctorModel>()
            join u in db.Set<User>() on d.UserId equals u.Id
            where d.IsPubliclyVisible && d.ApprovalStatus == ApprovalStatus.Approved
            select new { Doctor = d, User = u };

        // ── Filters ───────────────────────────────────────────────────────

        // SearchTerm: two-pronged approach for maximum recall:
        //   1. PostgreSQL FTS on SearchVector (Specialization A, HospitalName B, Qualification B, City C, Bio D)
        //      — handles partial tokens, stemming, and ranked proximity.
        //      SearchVector may be null (pre-migration rows) so fall back to LIKE when null.
        //   2. LIKE on User.FullName — FTS vector does not include cross-table columns.
        //
        // The two predicates are combined with OR so either path finds a match.
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term       = request.SearchTerm.Trim().ToLower();
            // Pre-compute the tsquery string as a captured variable so EF Core
            // can translate it as a parameterized server-side expression.
            // EF.Functions.ToTsQuery MUST be called inside the lambda — calling it
            // outside the expression tree causes client-evaluation and an exception.
            var tsQueryStr = term.Replace(" ", " & ") + ":*";

            query = query.Where(x =>
                // Path 1: FTS on SearchVector (Doctor fields)
                (x.Doctor.SearchVector != null && x.Doctor.SearchVector.Matches(EF.Functions.ToTsQuery("english", tsQueryStr)))
                ||
                // Path 1b: LIKE fallback for rows without SearchVector yet
                (x.Doctor.SearchVector == null && (
                    (x.Doctor.Specialization != null && x.Doctor.Specialization.ToLower().Contains(term)) ||
                    (x.Doctor.City          != null && x.Doctor.City.ToLower().Contains(term))            ||
                    (x.Doctor.HospitalName  != null && x.Doctor.HospitalName.ToLower().Contains(term))   ||
                    (x.Doctor.Bio           != null && x.Doctor.Bio.ToLower().Contains(term))))
                ||
                // Path 2: LIKE on FullName (always — not in SearchVector)
                x.User.FullName.ToLower().Contains(term));
        }

        // Specialization: uses normalized column for index-accelerated exact-match.
        if (!string.IsNullOrWhiteSpace(request.Specialization))
        {
            var spec = request.Specialization.Trim().ToLowerInvariant();
            query = query.Where(x => x.Doctor.SpecializationNormalized == spec);
        }

        // City: uses normalized column for index-accelerated exact-match.
        if (!string.IsNullOrWhiteSpace(request.City))
        {
            var city = request.City.Trim().ToLowerInvariant();
            query = query.Where(x => x.Doctor.CityNormalized == city);
        }

        // State: no normalized column, LOWER() at query time.
        if (!string.IsNullOrWhiteSpace(request.State))
        {
            var state = request.State.Trim().ToLower();
            query = query.Where(x => x.Doctor.State != null && x.Doctor.State.ToLower().Contains(state));
        }

        // Language: case-insensitive any-element check.
        // We lower-case at query time so "hindi", "Hindi", "HINDI" all match.
        if (!string.IsNullOrWhiteSpace(request.Language))
        {
            var lang = request.Language.Trim().ToLower();
            query = query.Where(x =>
                x.Doctor.LanguagesSpoken != null &&
                x.Doctor.LanguagesSpoken.Any(l => l.ToLower() == lang));
        }

        // Experience range.
        if (request.MinExperience.HasValue)
            query = query.Where(x => x.Doctor.ExperienceYears >= request.MinExperience.Value);

        if (request.MaxExperience.HasValue)
            query = query.Where(x => x.Doctor.ExperienceYears <= request.MaxExperience.Value);

        // Fee range.
        if (request.MinConsultationFee.HasValue)
            query = query.Where(x => x.Doctor.ConsultationFee >= request.MinConsultationFee.Value);

        if (request.MaxConsultationFee.HasValue)
            query = query.Where(x => x.Doctor.ConsultationFee <= request.MaxConsultationFee.Value);

        // ── Count (before pagination) ─────────────────────────────────────
        var totalCount = await query.CountAsync(ct);

        // ── Pagination ────────────────────────────────────────────────────
        var page     = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 50);

        // ── Sorting ───────────────────────────────────────────────────────
        // Apply ordering and stable secondary sort (Doctor.Id for deterministic paging).
        var sortBy       = AllowedSortFields.Contains(request.SortBy ?? "") ? request.SortBy! : "name";
        var isDescending = string.Equals(request.SortDirection, "desc", StringComparison.OrdinalIgnoreCase);

        // "relevance" sort is handled in-memory by SearchRankingService after results are fetched.
        // At the DB level we fall back to "name" so we get a stable, deterministic base set.
        var dbSortBy = string.Equals(sortBy, "relevance", StringComparison.OrdinalIgnoreCase) ? "name" : sortBy;

        // We work entirely in the anonymous-type query; no dynamic cast needed.
        // Each branch fully materializes an IOrderedQueryable with the correct key.
        var sortedQuery = (dbSortBy, isDescending) switch
        {
            ("fee",        false) => query.OrderBy(x => x.Doctor.ConsultationFee).ThenBy(x => x.Doctor.Id),
            ("fee",        true)  => query.OrderByDescending(x => x.Doctor.ConsultationFee).ThenBy(x => x.Doctor.Id),
            ("experience", false) => query.OrderBy(x => x.Doctor.ExperienceYears).ThenBy(x => x.Doctor.Id),
            ("experience", true)  => query.OrderByDescending(x => x.Doctor.ExperienceYears).ThenBy(x => x.Doctor.Id),
            ("rating",     false) => query.OrderBy(x => x.Doctor.Rating).ThenBy(x => x.Doctor.Id),
            ("rating",     true)  => query.OrderByDescending(x => x.Doctor.Rating).ThenBy(x => x.Doctor.Id),
            (_,            false) => query.OrderBy(x => x.User.FullName).ThenBy(x => x.Doctor.Id),
            (_,            true)  => query.OrderByDescending(x => x.User.FullName).ThenBy(x => x.Doctor.Id),
        };

        var items = await sortedQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new DoctorSearchResult(
                x.Doctor.Id,
                x.User.FullName,
                x.Doctor.Specialization,
                x.Doctor.Qualification,
                x.Doctor.ExperienceYears,
                x.Doctor.ConsultationFee,
                x.Doctor.Rating,
                x.Doctor.TotalReviews,
                x.Doctor.HospitalName,
                x.Doctor.City,
                x.Doctor.State,
                x.Doctor.Country,
                x.Doctor.LanguagesSpoken == null
                    ? (IReadOnlyList<string>)Array.Empty<string>()
                    : x.Doctor.LanguagesSpoken,
                x.Doctor.ProfileImageUrl,
                x.Doctor.IsPubliclyVisible))
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<DiscoveryFilterOptions> GetFilterOptionsAsync(CancellationToken ct = default)
    {
        // Base eligibility: same gate as SearchAsync — only approved + visible doctors.
        var baseQuery =
            from d in db.Set<DoctorModel>()
            where d.IsPubliclyVisible && d.ApprovalStatus == ApprovalStatus.Approved
                  && d.DeletedAt == null
            select d;

        // Distinct specializations — sorted alphabetically, nulls excluded.
        var specializations = await baseQuery
            .Where(d => d.Specialization != null)
            .Select(d => d.Specialization!)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync(ct);

        // Distinct cities — sorted alphabetically, nulls excluded.
        var cities = await baseQuery
            .Where(d => d.City != null)
            .Select(d => d.City!)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync(ct);

        // Distinct languages — unnest the LanguagesSpoken text[] and collect distinct values.
        // EF translates SelectMany on a PrimitiveCollection to UNNEST() in PostgreSQL.
        var languages = await baseQuery
            .Where(d => d.LanguagesSpoken != null)
            .SelectMany(d => d.LanguagesSpoken!)
            .Distinct()
            .OrderBy(l => l)
            .ToListAsync(ct);

        return new DiscoveryFilterOptions(specializations, cities, languages);
    }

    public async Task<IReadOnlyList<string>> GetDistinctSpecializationsMatchingAsync(
        string query,
        CancellationToken ct = default,
        int limit = 15)
    {
        if (string.IsNullOrWhiteSpace(query)) return [];

        var lower = query.Trim().ToLowerInvariant();

        // Use SpecializationNormalized (indexed) for the WHERE predicate,
        // but return the original Specialization for proper casing.
        return await db.Set<DoctorModel>()
            .Where(d => d.IsPubliclyVisible
                        && d.ApprovalStatus == ApprovalStatus.Approved
                        && d.SpecializationNormalized != null
                        && d.SpecializationNormalized.Contains(lower)
                        && d.Specialization != null)
            .Select(d => d.Specialization!)
            .Distinct()
            .OrderBy(s => s)
            .Take(limit)
            .ToListAsync(ct);
    }
}
