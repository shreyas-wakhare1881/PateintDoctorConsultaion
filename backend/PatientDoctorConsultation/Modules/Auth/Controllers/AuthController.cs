using System.Security.Claims;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PatientDoctorConsultation.Modules.Auth.DTOs;
using PatientDoctorConsultation.Modules.Auth.Interfaces;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.Auth.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>Register a new Doctor account. Doctor accounts are inactive until approved by admin. Patients do not register — they authenticate via OTP.</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request,
        [FromServices] IValidator<RegisterRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var profile = await authService.RegisterAsync(request, ct);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<UserProfileDto>.Ok(profile, "Registration successful. Awaiting admin approval."));
    }

    /// <summary>Login with email and password. Available for Doctor and Admin roles only.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        [FromServices] IValidator<LoginRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var tokens = await authService.LoginAsync(request, ct);
        return Ok(ApiResponse<AuthTokenResponse>.Ok(tokens, "Login successful."));
    }

    /// <summary>Send 6-digit OTP to patient phone number (E.164 format). Auto-creates Patient account on first request. Patient-only flow.</summary>
    [HttpPost("send-otp")]
    [ProducesResponseType(typeof(ApiResponse<OtpResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendOtp(
        [FromBody] SendOtpRequest request,
        [FromServices] IValidator<SendOtpRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var response = await authService.SendOtpAsync(request, ct);
        return Ok(ApiResponse<OtpResponse>.Ok(response, "OTP dispatched successfully."));
    }

    /// <summary>Verify 6-digit OTP submitted by patient. Issues JWT + refresh token on success. Patient-only flow.</summary>
    [HttpPost("verify-otp")]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerifyOtp(
        [FromBody] VerifyOtpRequest request,
        [FromServices] IValidator<VerifyOtpRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var tokens = await authService.VerifyOtpAsync(request, ct);
        return Ok(ApiResponse<AuthTokenResponse>.Ok(tokens, "OTP verified successfully."));
    }

    /// <summary>Rotate refresh token and issue a new JWT access token pair.</summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<AuthTokenResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(
        [FromBody] RefreshTokenRequest request,
        [FromServices] IValidator<RefreshTokenRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var tokens = await authService.RefreshTokenAsync(request, ct);
        return Ok(ApiResponse<AuthTokenResponse>.Ok(tokens, "Token refreshed successfully."));
    }

    /// <summary>Revoke the current session's refresh token. Requires valid Bearer JWT.</summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout(
        [FromBody] RefreshTokenRequest request,
        CancellationToken ct)
    {
        var userId = ExtractUserId();
        await authService.LogoutAsync(userId, request.RefreshToken, ct);
        return Ok(ApiResponse.Ok("Logged out successfully."));
    }

    /// <summary>Get the currently authenticated user's profile from JWT claims.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var userId  = ExtractUserId();
        var profile = await authService.GetCurrentUserAsync(userId, ct);
        return Ok(ApiResponse<UserProfileDto>.Ok(profile));
    }

    /// <summary>Update FullName and/or PhoneNumber for the authenticated user.</summary>
    [HttpPut("profile")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        [FromServices] IValidator<UpdateProfileRequest> validator,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return BadRequest(ApiResponse<object>.Fail("Validation failed.", ToErrorDictionary(validation)));

        var userId  = ExtractUserId();
        var profile = await authService.UpdateProfileAsync(userId, request, ct);
        return Ok(ApiResponse<UserProfileDto>.Ok(profile, "Profile updated successfully."));
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private Guid ExtractUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");

        if (sub is null || !Guid.TryParse(sub, out var userId))
            throw new UnauthorizedAccessException("User identity not found in token.");

        return userId;
    }

    private static IReadOnlyDictionary<string, string[]> ToErrorDictionary(ValidationResult result)
        => result.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
}
