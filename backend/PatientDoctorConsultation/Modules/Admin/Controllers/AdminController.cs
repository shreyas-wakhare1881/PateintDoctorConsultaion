using System.Security.Claims;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PatientDoctorConsultation.Modules.Admin.DTOs;
using PatientDoctorConsultation.Modules.Admin.Interfaces;
using PatientDoctorConsultation.Modules.Admin.Validators;
using PatientDoctorConsultation.Shared.Constants;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.Admin.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = Roles.Admin)]
public sealed class AdminController(IAdminService adminService) : ControllerBase
{
    // ════════════════════════════════════════════════════════════════════════
    // DASHBOARD
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>Returns aggregated platform statistics for the admin dashboard.</summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(ApiResponse<AdminDashboardResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard()
    {
        var response = await adminService.GetDashboardAsync();
        return Ok(ApiResponse<AdminDashboardResponse>.Ok(response));
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR MODERATION
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>Lists doctors pending approval — ordered newest first.</summary>
    [HttpGet("doctors/pending")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<AdminPendingDoctorItem>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingDoctors(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await adminService.GetPendingDoctorsAsync(page, pageSize);
        return Ok(ApiResponse<PaginatedResponse<AdminPendingDoctorItem>>.Ok(result));
    }

    /// <summary>Paginated list of all doctors with optional ApprovalStatus / City / Search filters.</summary>
    [HttpGet("doctors")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<AdminDoctorListItem>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAllDoctors(
        [FromQuery] AdminDoctorListQuery query,
        [FromServices] IValidator<AdminDoctorListQuery> validator)
    {
        var validation = await validator.ValidateAsync(query);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var result = await adminService.GetAllDoctorsAsync(query);
        return Ok(ApiResponse<PaginatedResponse<AdminDoctorListItem>>.Ok(result));
    }

    /// <summary>Approves a Pending or Rejected doctor. Sets IsPubliclyVisible = IsProfileCompleted.</summary>
    [HttpPatch("doctors/{doctorId:guid}/approve")]
    [ProducesResponseType(typeof(ApiResponse<DoctorModerationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveDoctor(
        Guid doctorId,
        [FromBody] DoctorModerationRequest request,
        [FromServices] DoctorApproveRequestValidator validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var result = await adminService.ApproveDoctorAsync(ExtractAdminId(), doctorId, request);
        return Ok(ApiResponse<DoctorModerationResponse>.Ok(result, "Doctor approved successfully."));
    }

    /// <summary>Rejects a Pending doctor. Reason is required.</summary>
    [HttpPatch("doctors/{doctorId:guid}/reject")]
    [ProducesResponseType(typeof(ApiResponse<DoctorModerationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectDoctor(
        Guid doctorId,
        [FromBody] DoctorModerationRequest request,
        [FromServices] DoctorRejectRequestValidator validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var result = await adminService.RejectDoctorAsync(ExtractAdminId(), doctorId, request);
        return Ok(ApiResponse<DoctorModerationResponse>.Ok(result, "Doctor rejected."));
    }

    /// <summary>Suspends an Approved doctor. Reason is required.</summary>
    [HttpPatch("doctors/{doctorId:guid}/suspend")]
    [ProducesResponseType(typeof(ApiResponse<DoctorModerationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SuspendDoctor(
        Guid doctorId,
        [FromBody] DoctorModerationRequest request,
        [FromServices] DoctorRejectRequestValidator validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var result = await adminService.SuspendDoctorAsync(ExtractAdminId(), doctorId, request);
        return Ok(ApiResponse<DoctorModerationResponse>.Ok(result, "Doctor suspended."));
    }

    /// <summary>Reactivates a Suspended doctor back to Approved.</summary>
    [HttpPatch("doctors/{doctorId:guid}/reactivate")]
    [ProducesResponseType(typeof(ApiResponse<DoctorModerationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReactivateDoctor(
        Guid doctorId,
        [FromBody] DoctorModerationRequest request,
        [FromServices] DoctorApproveRequestValidator validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var result = await adminService.ReactivateDoctorAsync(ExtractAdminId(), doctorId, request);
        return Ok(ApiResponse<DoctorModerationResponse>.Ok(result, "Doctor reactivated successfully."));
    }

    // ════════════════════════════════════════════════════════════════════════
    // PATIENT MODERATION
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>Paginated list of all patients with optional IsActive / Search filters.</summary>
    [HttpGet("patients")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<AdminPatientListItem>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAllPatients(
        [FromQuery] AdminPatientListQuery query,
        [FromServices] IValidator<AdminPatientListQuery> validator)
    {
        var validation = await validator.ValidateAsync(query);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var result = await adminService.GetAllPatientsAsync(query);
        return Ok(ApiResponse<PaginatedResponse<AdminPatientListItem>>.Ok(result));
    }

    /// <summary>Blocks a patient account (sets IsActive = false). Reason required.</summary>
    [HttpPatch("patients/{userId:guid}/block")]
    [ProducesResponseType(typeof(ApiResponse<PatientModerationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> BlockPatient(
        Guid userId,
        [FromBody] PatientModerationRequest request,
        [FromServices] PatientBlockRequestValidator validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var result = await adminService.BlockPatientAsync(ExtractAdminId(), userId, request);
        return Ok(ApiResponse<PatientModerationResponse>.Ok(result, "Patient account blocked."));
    }

    /// <summary>Unblocks a patient account (sets IsActive = true).</summary>
    [HttpPatch("patients/{userId:guid}/unblock")]
    [ProducesResponseType(typeof(ApiResponse<PatientModerationResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnblockPatient(
        Guid userId,
        [FromBody] PatientModerationRequest request,
        [FromServices] PatientUnblockRequestValidator validator)
    {
        var validation = await validator.ValidateAsync(request);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var result = await adminService.UnblockPatientAsync(ExtractAdminId(), userId, request);
        return Ok(ApiResponse<PatientModerationResponse>.Ok(result, "Patient account unblocked."));
    }

    // ════════════════════════════════════════════════════════════════════════
    // CONSULTATION MONITORING
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>Paginated consultation list with multi-dimensional filters for admin monitoring.</summary>
    [HttpGet("consultations")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<AdminConsultationListItem>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAllConsultations(
        [FromQuery] AdminConsultationListQuery query,
        [FromServices] IValidator<AdminConsultationListQuery> validator)
    {
        var validation = await validator.ValidateAsync(query);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var result = await adminService.GetAllConsultationsAsync(query);
        return Ok(ApiResponse<PaginatedResponse<AdminConsultationListItem>>.Ok(result));
    }

    /// <summary>Full read-only detail for a specific consultation including status history.</summary>
    [HttpGet("consultations/{consultationId:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AdminConsultationDetail>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetConsultationDetail(Guid consultationId)
    {
        var result = await adminService.GetConsultationDetailAsync(consultationId);
        return Ok(ApiResponse<AdminConsultationDetail>.Ok(result));
    }

    // ════════════════════════════════════════════════════════════════════════
    // AUDIT LOGS
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>Paginated audit log feed with filters for governance review.</summary>
    [HttpGet("audit-logs")]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResponse<AdminAuditLogListItem>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] AdminAuditLogQuery query,
        [FromServices] IValidator<AdminAuditLogQuery> validator)
    {
        var validation = await validator.ValidateAsync(query);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var result = await adminService.GetAuditLogsAsync(query);
        return Ok(ApiResponse<PaginatedResponse<AdminAuditLogListItem>>.Ok(result));
    }

    // ════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ════════════════════════════════════════════════════════════════════════

    private Guid ExtractAdminId()
        => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static Dictionary<string, string[]> ToErrorDictionary(ValidationResult result)
        => result.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(
                g => g.Key,
                g => g.Select(e => e.ErrorMessage).ToArray());
}

