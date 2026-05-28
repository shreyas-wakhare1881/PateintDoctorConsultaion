using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PatientDoctorConsultation.Modules.Prescription.DTOs;
using PatientDoctorConsultation.Modules.Prescription.Interfaces;
using PatientDoctorConsultation.Shared.Constants;
using PatientDoctorConsultation.Shared.Exceptions;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.Prescription.Controllers;

[ApiController]
[Produces("application/json")]
public class PrescriptionController(IPrescriptionService prescriptionService) : ControllerBase
{
    // ── POST /api/consultations/{id}/prescription ─────────────────────────
    [HttpPost("api/consultations/{id:guid}/prescription")]
    [Authorize(Roles = Roles.Doctor)]
    [ProducesResponseType(typeof(ApiResponse<PrescriptionResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreatePrescription(
        [FromRoute] Guid id,
        [FromBody] CreatePrescriptionRequest request,
        CancellationToken ct)
    {
        var doctorId = ExtractUserId();
        var result = await prescriptionService.CreateAsync(id, doctorId, request, ct);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<PrescriptionResponse>.Ok(result, "Prescription created successfully."));
    }

    // ── GET /api/consultations/{id}/prescription ──────────────────────────
    [HttpGet("api/consultations/{id:guid}/prescription")]
    [Authorize(Roles = $"{Roles.Doctor},{Roles.Patient}")]
    [ProducesResponseType(typeof(ApiResponse<PrescriptionResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPrescription(
        [FromRoute] Guid id,
        CancellationToken ct)
    {
        var callerId = ExtractUserId();
        var callerRole = ExtractUserRole();
        var result = await prescriptionService.GetByConsultationAsync(id, callerId, callerRole, ct);
        return Ok(ApiResponse<PrescriptionResponse>.Ok(result));
    }

    // ── GET /api/prescriptions/my ─────────────────────────────────────────
    [HttpGet("api/prescriptions/my")]
    [Authorize(Roles = Roles.Patient)]
    [ProducesResponseType(typeof(ApiResponse<List<PrescriptionResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyPrescriptions(CancellationToken ct)
    {
        var patientId = ExtractUserId();
        var result = await prescriptionService.GetMyPrescriptionsAsync(patientId, ct);
        return Ok(ApiResponse<List<PrescriptionResponse>>.Ok(result));
    }

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
}
