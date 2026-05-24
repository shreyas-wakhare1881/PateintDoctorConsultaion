using System.Security.Claims;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PatientDoctorConsultation.Modules.Doctor.DTOs;
using PatientDoctorConsultation.Modules.Doctor.Interfaces;
using PatientDoctorConsultation.Shared.Constants;
using PatientDoctorConsultation.Shared.Exceptions;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.Doctor.Controllers;

[ApiController]
[Route("api/doctors")]
[Produces("application/json")]
public class DoctorController(IDoctorService doctorService) : ControllerBase
{
    // ════════════════════════════════════════════════════════════════════════
    // PROFILE — PROTECTED (Doctor role)
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>Create a doctor profile for the authenticated Doctor account.</summary>
    [HttpPost("profile")]
    [Authorize(Roles = Roles.Doctor)]
    [ProducesResponseType(typeof(ApiResponse<DoctorProfileResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateProfile(
        [FromBody] CreateDoctorProfileRequest request,
        [FromServices] IValidator<CreateDoctorProfileRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var userId  = ExtractUserId();
        var profile = await doctorService.CreateProfileAsync(userId, request, ct);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<DoctorProfileResponse>.Ok(profile, "Doctor profile created successfully. Awaiting admin approval."));
    }

    /// <summary>Get the profile of the currently authenticated doctor.</summary>
    [HttpGet("profile/me")]
    [Authorize(Roles = Roles.Doctor)]
    [ProducesResponseType(typeof(ApiResponse<DoctorProfileResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile(CancellationToken ct)
    {
        var userId  = ExtractUserId();
        var profile = await doctorService.GetMyProfileAsync(userId, ct);
        return Ok(ApiResponse<DoctorProfileResponse>.Ok(profile));
    }

    /// <summary>Update the profile of the currently authenticated doctor (partial update).</summary>
    [HttpPatch("profile/me")]
    [Authorize(Roles = Roles.Doctor)]
    [ProducesResponseType(typeof(ApiResponse<DoctorProfileResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateMyProfile(
        [FromBody] UpdateDoctorProfileRequest request,
        [FromServices] IValidator<UpdateDoctorProfileRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var userId  = ExtractUserId();
        var profile = await doctorService.UpdateMyProfileAsync(userId, request, ct);
        return Ok(ApiResponse<DoctorProfileResponse>.Ok(profile, "Profile updated successfully."));
    }

    // ════════════════════════════════════════════════════════════════════════
    // AVAILABILITY — PROTECTED (Doctor role)
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>Add a recurring weekly availability slot for the authenticated doctor.</summary>
    [HttpPost("availability")]
    [Authorize(Roles = Roles.Doctor)]
    [ProducesResponseType(typeof(ApiResponse<AvailabilityResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AddAvailability(
        [FromBody] CreateAvailabilityRequest request,
        [FromServices] IValidator<CreateAvailabilityRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var userId = ExtractUserId();
        var slot   = await doctorService.AddAvailabilityAsync(userId, request, ct);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<AvailabilityResponse>.Ok(slot, "Availability slot added successfully."));
    }

    /// <summary>Get all availability slots for the authenticated doctor.</summary>
    [HttpGet("availability/me")]
    [Authorize(Roles = Roles.Doctor)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AvailabilityResponse>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyAvailability(CancellationToken ct)
    {
        var userId = ExtractUserId();
        var slots  = await doctorService.GetMyAvailabilityAsync(userId, ct);
        return Ok(ApiResponse<IReadOnlyList<AvailabilityResponse>>.Ok(slots));
    }

    /// <summary>Update an existing availability slot owned by the authenticated doctor.</summary>
    [HttpPatch("availability/{slotId:guid}")]
    [Authorize(Roles = Roles.Doctor)]
    [ProducesResponseType(typeof(ApiResponse<AvailabilityResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateAvailability(
        Guid slotId,
        [FromBody] UpdateAvailabilityRequest request,
        [FromServices] IValidator<UpdateAvailabilityRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var userId = ExtractUserId();
        var slot   = await doctorService.UpdateAvailabilityAsync(userId, slotId, request, ct);
        return Ok(ApiResponse<AvailabilityResponse>.Ok(slot, "Availability slot updated successfully."));
    }

    /// <summary>Delete an availability slot owned by the authenticated doctor.</summary>
    [HttpDelete("availability/{slotId:guid}")]
    [Authorize(Roles = Roles.Doctor)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAvailability(Guid slotId, CancellationToken ct)
    {
        var userId = ExtractUserId();
        await doctorService.DeleteAvailabilityAsync(userId, slotId, ct);
        return Ok(ApiResponse.Ok("Availability slot deleted successfully."));
    }

    // ════════════════════════════════════════════════════════════════════════
    // PUBLIC DISCOVERY — Anonymous
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>Search for publicly listed, approved doctors with optional filters and pagination.</summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<DoctorPublicListItemResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPublicDoctors(
        [FromQuery] DoctorListQuery query,
        CancellationToken ct)
    {
        var result = await doctorService.GetPublicDoctorsAsync(query, ct);
        return Ok(ApiResponse<PaginatedResponse<DoctorPublicListItemResponse>>.Ok(result));
    }

    /// <summary>Get the full public profile of a specific approved doctor including availability.</summary>
    [HttpGet("{doctorId:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<DoctorPublicDetailResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPublicDoctorDetail(Guid doctorId, CancellationToken ct)
    {
        var result = await doctorService.GetPublicDoctorDetailAsync(doctorId, ct);
        return Ok(ApiResponse<DoctorPublicDetailResponse>.Ok(result));
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

    private static IReadOnlyDictionary<string, string[]> ToErrorDictionary(ValidationResult result)
        => result.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
}

