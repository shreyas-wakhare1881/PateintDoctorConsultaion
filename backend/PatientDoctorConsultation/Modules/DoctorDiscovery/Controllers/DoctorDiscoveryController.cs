using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using PatientDoctorConsultation.Modules.DoctorDiscovery.DTOs;
using PatientDoctorConsultation.Modules.DoctorDiscovery.Interfaces;
using PatientDoctorConsultation.Modules.DoctorDiscovery.NLP;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.Controllers;

/// <summary>
/// Public doctor discovery API.
/// Route: GET /api/discovery/doctors
///
/// Fully anonymous — no authentication required. Returns only approved and publicly
/// visible doctors. All filters are optional; the eligibility gate (IsPubliclyVisible
/// + ApprovalStatus = Approved) is always applied at the repository layer.
/// </summary>
[ApiController]
[Route("api/discovery")]
[AllowAnonymous]
[Produces("application/json")]
public class DoctorDiscoveryController(
    IDoctorDiscoveryService discoveryService,
    INlpSearchService nlpSearchService,
    ISuggestionService suggestionService) : ControllerBase
{
    /// <summary>
    /// Search publicly available doctors with rich filtering, sorting, and pagination.
    /// </summary>
    /// <remarks>
    /// All query parameters are optional. Combine any subset of filters:
    /// - searchTerm: substring across name, specialization, city, hospital name
    /// - specialization / city: case-insensitive exact match (index-accelerated)
    /// - state / language: case-insensitive substring / array-contains
    /// - minExperience / maxExperience: years of experience range
    /// - minConsultationFee / maxConsultationFee: fee range
    /// - sortBy: fee | experience | rating | name (default: name)
    /// - sortDirection: asc (default) | desc
    /// - page / pageSize: 1-based, pageSize clamped to [1, 50]
    /// </remarks>
    [HttpGet("doctors")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<DoctorSearchResult>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SearchDoctors(
        [FromQuery] DoctorSearchRequest request,
        [FromServices] IValidator<DoctorSearchRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            var errors = validation.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray());
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", errors));
        }

        var result = await discoveryService.SearchDoctorsAsync(request, ct);
        return Ok(ApiResponse<PaginatedResponse<DoctorSearchResult>>.Ok(result));
    }

    /// <summary>
    /// Returns dynamic filter option values for UI dropdowns.
    /// Specializations, cities, and languages are sourced from actual
    /// approved+visible doctor data — never hardcoded.
    /// </summary>
    [HttpGet("filters")]
    [ProducesResponseType(typeof(ApiResponse<DiscoveryFilterOptions>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFilterOptions(CancellationToken ct)
    {
        var result = await discoveryService.GetFilterOptionsAsync(ct);
        return Ok(ApiResponse<DiscoveryFilterOptions>.Ok(result));
    }

    /// <summary>
    /// NLP-powered search: converts a natural-language patient query into a structured
    /// doctor search request using the intent parser and medical synonym engine.
    ///
    /// Examples:
    ///   ?query=heart+doctor+in+pune          → Cardiologist, City=Pune
    ///   ?query=child+doctor+under+1000       → Pediatrician, MaxFee=1000
    ///   ?query=marathi+speaking+skin+doctor  → Dermatologist, Language=Marathi
    ///
    /// Explicit override parameters (specialization, city, etc.) take priority
    /// over NLP-inferred values — enabling hybrid filter+NLP UX.
    ///
    /// Every search is recorded in SearchQueries for analytics.
    /// </summary>
    [HttpGet("nlp-search")]
    [ProducesResponseType(typeof(ApiResponse<NlpSearchResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> NlpSearch(
        [FromQuery] NlpSearchRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Query))
            return BadRequest(ApiResponse<object>.Fail("Query parameter is required."));

        // Extract authenticated PatientId for analytics (null for anonymous).
        var patientId = User.FindFirst(ClaimTypes.NameIdentifier) is { Value: var raw }
                        && Guid.TryParse(raw, out var pid) ? pid : (Guid?)null;

        var result = await nlpSearchService.SearchAsync(request, patientId, ct);
        return Ok(ApiResponse<NlpSearchResponse>.Ok(result));
    }

    /// <summary>
    /// Returns auto-complete suggestions for the search box.
    /// Combines canonical specialization names, patient-language synonyms,
    /// and actual DB specialization values.
    ///
    /// Requires at least 2 characters. Returns up to 10 suggestions.
    /// </summary>
    [HttpGet("suggestions")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<SearchSuggestion>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSuggestions(
        [FromQuery] string q,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
            return Ok(ApiResponse<IReadOnlyList<SearchSuggestion>>.Ok([]));

        var suggestions = await suggestionService.GetSuggestionsAsync(q.Trim(), 10, ct);
        return Ok(ApiResponse<IReadOnlyList<SearchSuggestion>>.Ok(suggestions));
    }
}
