using System.Security.Claims;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PatientDoctorConsultation.Modules.Patient.DTOs;
using PatientDoctorConsultation.Modules.Patient.Interfaces;
using PatientDoctorConsultation.Shared.Constants;
using PatientDoctorConsultation.Shared.Exceptions;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.Patient.Controllers;

[ApiController]
[Route("api/patients")]
[Produces("application/json")]
[Authorize(Roles = Roles.Patient)]
public class PatientController(IPatientService patientService) : ControllerBase
{
    // ════════════════════════════════════════════════════════════════════════
    // PROFILE MANAGEMENT
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>Create a healthcare profile for the authenticated patient. Called once during onboarding.</summary>
    [HttpPost("profile")]
    [ProducesResponseType(typeof(ApiResponse<PatientProfileResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateProfile(
        [FromBody] CreatePatientProfileRequest request,
        [FromServices] IValidator<CreatePatientProfileRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var userId  = ExtractUserId();
        var profile = await patientService.CreateProfileAsync(userId, request, ct);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<PatientProfileResponse>.Ok(profile, "Patient profile created successfully."));
    }

    /// <summary>Get the complete healthcare profile of the currently authenticated patient.</summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<PatientProfileResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile(CancellationToken ct)
    {
        var userId  = ExtractUserId();
        var profile = await patientService.GetMyProfileAsync(userId, ct);
        return Ok(ApiResponse<PatientProfileResponse>.Ok(profile));
    }

    /// <summary>Update the authenticated patient's healthcare profile. All fields optional — partial update.</summary>
    [HttpPut("me")]
    [ProducesResponseType(typeof(ApiResponse<PatientProfileResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdatePatientProfileRequest request,
        [FromServices] IValidator<UpdatePatientProfileRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var userId  = ExtractUserId();
        var profile = await patientService.UpdateProfileAsync(userId, request, ct);
        return Ok(ApiResponse<PatientProfileResponse>.Ok(profile, "Profile updated successfully."));
    }

    /// <summary>
    /// Soft-delete the authenticated patient's profile.
    /// The record is retained with a DeletedAt timestamp — no data is destroyed.
    /// </summary>
    [HttpDelete("me")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProfile(CancellationToken ct)
    {
        var userId = ExtractUserId();
        await patientService.DeleteProfileAsync(userId, ct);
        return Ok(ApiResponse.Ok("Patient profile deleted successfully."));
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR DISCOVERY
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Search for approved, publicly visible doctors. Authenticated Patient endpoint.
    /// Supports filtering by city, specialization, language, and fee range.
    /// No patient data is ever included in this response.
    /// </summary>
    [HttpGet("doctors")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<PatientDoctorDiscoveryItem>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetDoctors(
        [FromQuery] PatientDoctorListQuery query,
        CancellationToken ct)
    {
        var result = await patientService.GetDoctorsAsync(query, ct);
        return Ok(ApiResponse<PaginatedResponse<PatientDoctorDiscoveryItem>>.Ok(result));
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

