using System.Security.Claims;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PatientDoctorConsultation.Modules.Consultation.DTOs;
using PatientDoctorConsultation.Modules.Consultation.Interfaces;
using PatientDoctorConsultation.Shared.Constants;
using PatientDoctorConsultation.Shared.Exceptions;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.Consultation.Controllers;

[ApiController]
[Route("api/consultations")]
[Produces("application/json")]
public class ConsultationController(IConsultationService consultationService) : ControllerBase
{
    // ════════════════════════════════════════════════════════════════════════
    // PATIENT — BOOK CONSULTATION
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Patient books a new consultation with an approved doctor.
    /// Creates a Consultation in Pending state and records the first status history entry.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.Patient)]
    [ProducesResponseType(typeof(ApiResponse<ConsultationDetailsResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> BookConsultation(
        [FromBody] BookConsultationRequest request,
        [FromServices] IValidator<BookConsultationRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var userId = ExtractUserId();
        var result = await consultationService.BookConsultationAsync(userId, request, ct);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ConsultationDetailsResponse>.Ok(result, "Consultation booked successfully. Awaiting doctor confirmation."));
    }

    // ════════════════════════════════════════════════════════════════════════
    // PATIENT — GET MY CONSULTATIONS
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Returns a paginated list of consultations for the authenticated patient.
    /// Supports optional filtering by status.
    /// </summary>
    [HttpGet("my")]
    [Authorize(Roles = Roles.Patient)]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<ConsultationSummaryResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyConsultations(
        [FromQuery] ConsultationListQuery query,
        CancellationToken ct)
    {
        var userId = ExtractUserId();
        var result = await consultationService.GetMyConsultationsAsync(userId, query, ct);
        return Ok(ApiResponse<PaginatedResponse<ConsultationSummaryResponse>>.Ok(result));
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHARED — GET CONSULTATION BY ID
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Returns full consultation details. Patient can only access their own consultations.
    /// Doctor can only access consultations assigned to them. Admin has full access.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = $"{Roles.Patient},{Roles.Doctor},{Roles.Admin}")]
    [ProducesResponseType(typeof(ApiResponse<ConsultationDetailsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetConsultationById(Guid id, CancellationToken ct)
    {
        var userId   = ExtractUserId();
        var userRole = ExtractUserRole();
        var result   = await consultationService.GetConsultationByIdAsync(userId, userRole, id, ct);
        return Ok(ApiResponse<ConsultationDetailsResponse>.Ok(result));
    }

    // ════════════════════════════════════════════════════════════════════════
    // PATIENT — CANCEL CONSULTATION
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Cancels a Pending or Confirmed consultation.
    /// CancelledBy is automatically derived from the caller's role.
    /// Completed, Rejected, and NoShow consultations cannot be cancelled.
    /// </summary>
    [HttpPut("{id:guid}/cancel")]
    [Authorize(Roles = $"{Roles.Patient},{Roles.Doctor},{Roles.Admin}")]
    [ProducesResponseType(typeof(ApiResponse<ConsultationDetailsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> CancelConsultation(
        Guid id,
        [FromBody] CancelConsultationRequest request,
        [FromServices] IValidator<CancelConsultationRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var userId   = ExtractUserId();
        var userRole = ExtractUserRole();
        var result   = await consultationService.CancelConsultationAsync(userId, userRole, id, request, ct);
        return Ok(ApiResponse<ConsultationDetailsResponse>.Ok(result, "Consultation cancelled successfully."));
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR — GET CONSULTATION REQUESTS (Pending)
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Returns all pending consultation requests assigned to the authenticated doctor.
    /// Ordered by scheduled date ascending — earliest first.
    /// </summary>
    [HttpGet("doctor/requests")]
    [Authorize(Roles = Roles.Doctor)]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<ConsultationSummaryResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetConsultationRequests(
        [FromQuery] ConsultationListQuery query,
        CancellationToken ct)
    {
        var userId = ExtractUserId();
        var result = await consultationService.GetConsultationRequestsAsync(userId, query, ct);
        return Ok(ApiResponse<PaginatedResponse<ConsultationSummaryResponse>>.Ok(result));
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR — CONFIRM CONSULTATION
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Doctor confirms a Pending consultation request.
    /// For Video type: MeetingRoomId and MeetingLink are generated.
    /// Status transitions: Pending → Confirmed.
    /// </summary>
    [HttpPut("{id:guid}/confirm")]
    [Authorize(Roles = Roles.Doctor)]
    [ProducesResponseType(typeof(ApiResponse<ConsultationDetailsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfirmConsultation(Guid id, CancellationToken ct)
    {
        var userId = ExtractUserId();
        var result = await consultationService.ConfirmConsultationAsync(userId, id, ct);
        return Ok(ApiResponse<ConsultationDetailsResponse>.Ok(result, "Consultation confirmed."));
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR — REJECT CONSULTATION
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Doctor declines a Pending consultation request with a mandatory reason.
    /// Status transitions: Pending → Rejected (terminal state).
    /// </summary>
    [HttpPut("{id:guid}/reject")]
    [Authorize(Roles = Roles.Doctor)]
    [ProducesResponseType(typeof(ApiResponse<ConsultationDetailsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectConsultation(
        Guid id,
        [FromBody] RejectConsultationRequest request,
        [FromServices] IValidator<RejectConsultationRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var userId = ExtractUserId();
        var result = await consultationService.RejectConsultationAsync(userId, id, request, ct);
        return Ok(ApiResponse<ConsultationDetailsResponse>.Ok(result, "Consultation rejected."));
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR — GET SCHEDULE (Confirmed + InProgress)
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Returns the doctor's upcoming confirmed and in-progress consultations.
    /// Supports optional date filter. Ordered by scheduled date ascending.
    /// </summary>
    [HttpGet("doctor/schedule")]
    [Authorize(Roles = Roles.Doctor)]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<ConsultationSummaryResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDoctorSchedule(
        [FromQuery] DoctorScheduleQuery query,
        CancellationToken ct)
    {
        var userId = ExtractUserId();
        var result = await consultationService.GetDoctorScheduleAsync(userId, query, ct);
        return Ok(ApiResponse<PaginatedResponse<ConsultationSummaryResponse>>.Ok(result));
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR — MARK IN PROGRESS
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Doctor starts the consultation session.
    /// Status transitions: Confirmed → InProgress.
    /// For Video type: MeetingStartedAt is stamped.
    /// </summary>
    [HttpPut("{id:guid}/start")]
    [Authorize(Roles = Roles.Doctor)]
    [ProducesResponseType(typeof(ApiResponse<ConsultationDetailsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StartConsultation(Guid id, CancellationToken ct)
    {
        var userId = ExtractUserId();
        var result = await consultationService.MarkInProgressAsync(userId, id, ct);
        return Ok(ApiResponse<ConsultationDetailsResponse>.Ok(result, "Consultation started."));
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR — MARK COMPLETED
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Doctor concludes the consultation. Optional clinical notes can be added.
    /// Status transitions: InProgress → Completed.
    /// For Video type: MeetingEndedAt is stamped.
    /// Doctor's TotalConsultations counter is incremented.
    /// </summary>
    [HttpPut("{id:guid}/complete")]
    [Authorize(Roles = Roles.Doctor)]
    [ProducesResponseType(typeof(ApiResponse<ConsultationDetailsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CompleteConsultation(
        Guid id,
        [FromBody] CompleteConsultationRequest request,
        [FromServices] IValidator<CompleteConsultationRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var userId = ExtractUserId();
        var result = await consultationService.MarkCompletedAsync(userId, id, request, ct);
        return Ok(ApiResponse<ConsultationDetailsResponse>.Ok(result, "Consultation completed successfully."));
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHARED — GET STATUS HISTORY
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Returns the full chronological status audit trail for a consultation.
    /// Accessible by the patient who owns it, the assigned doctor, or any Admin.
    /// </summary>
    [HttpGet("{id:guid}/history")]
    [Authorize(Roles = $"{Roles.Patient},{Roles.Doctor},{Roles.Admin}")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ConsultationStatusHistoryResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStatusHistory(Guid id, CancellationToken ct)
    {
        var userId   = ExtractUserId();
        var userRole = ExtractUserRole();
        var result   = await consultationService.GetStatusHistoryAsync(userId, userRole, id, ct);
        return Ok(ApiResponse<IReadOnlyList<ConsultationStatusHistoryResponse>>.Ok(result));
    }

    // ════════════════════════════════════════════════════════════════════════
    // ADMIN — GET ALL CONSULTATIONS
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Admin endpoint — returns all platform consultations with full filter support.
    /// Supports filtering by status, doctor, patient, date range, and consultation type.
    /// </summary>
    [HttpGet("admin/all")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<ConsultationSummaryResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAllConsultations(
        [FromQuery] AdminConsultationQuery query,
        CancellationToken ct)
    {
        var result = await consultationService.GetAllConsultationsAsync(query, ct);
        return Ok(ApiResponse<PaginatedResponse<ConsultationSummaryResponse>>.Ok(result));
    }

    // ════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ════════════════════════════════════════════════════════════════════════

    private Guid ExtractUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");

        if (sub is null || !Guid.TryParse(sub, out var userId))
            throw new UnauthorizedException("User identity not found in token.");

        return userId;
    }

    private string ExtractUserRole()
        => User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

    private static IReadOnlyDictionary<string, string[]> ToErrorDictionary(ValidationResult result)
        => result.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
}

