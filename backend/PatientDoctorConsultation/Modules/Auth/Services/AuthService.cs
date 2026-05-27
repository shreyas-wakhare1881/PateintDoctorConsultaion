using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatientDoctorConsultation.Infrastructure.Identity.Jwt;
using PatientDoctorConsultation.Infrastructure.Identity.OTP;
using PatientDoctorConsultation.Infrastructure.Identity.Passwords;
using PatientDoctorConsultation.Infrastructure.Persistence.Context;
using PatientDoctorConsultation.Modules.Auth.DTOs;
using PatientDoctorConsultation.Modules.Auth.Interfaces;
using PatientDoctorConsultation.Modules.Auth.Models;
using PatientDoctorConsultation.Shared.Constants;
using PatientDoctorConsultation.Shared.Enums;
using PatientDoctorConsultation.Shared.Exceptions;

namespace PatientDoctorConsultation.Modules.Auth.Services;

public sealed class AuthService(
    ApplicationDbContext db,
    IJwtTokenGenerator jwtGenerator,
    IOtpService otpService,
    IPasswordService passwordService,
    IMapper mapper,
    ILogger<AuthService> logger) : IAuthService
{
    // ──────────────────────────────────────────────────────────────────────────
    // REGISTER
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<UserProfileDto> RegisterAsync(
        RegisterRequest request,
        CancellationToken ct = default)
    {
        if (!Enum.TryParse<UserRole>(
                request.Role,
                ignoreCase: true,
                out var role) ||
            role is UserRole.Admin or UserRole.Patient)
        {
            throw DomainValidationException.For(
                nameof(request.Role),
                "Only Doctor self-registration is permitted through this endpoint.");
        }

        var normalizedEmail = request.Email.Trim().ToLower();

        var emailTaken = await db.Set<User>()
            .AnyAsync(u => u.Email == normalizedEmail, ct);

        if (emailTaken)
        {
            throw new ConflictException(
                "An account with this email address already exists.");
        }

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            var normalizedPhone = request.PhoneNumber.Trim();

            var phoneTaken = await db.Set<User>()
                .AnyAsync(u => u.PhoneNumber == normalizedPhone, ct);

            if (phoneTaken)
            {
                throw new ConflictException(
                    "An account with this phone number already exists.");
            }
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            PhoneNumber = request.PhoneNumber?.Trim() ?? string.Empty,

            PasswordHash = passwordService.Hash(request.Password),

            Role = role,

            // DEVELOPMENT MODE:
            // Immediate activation for easier testing.
            // Later can be switched to:
            // IsActive = false
            // for admin approval workflow.
            IsActive = true,

            // OTP verification only for OTP-based flows.
            IsVerified = false,

            CreatedAt = DateTime.UtcNow
        };

        db.Set<User>().Add(user);

        await db.SaveChangesAsync(ct);

        logger.LogInformation("New {Role} account registered. UserId={UserId}", role, user.Id);

        return mapper.Map<UserProfileDto>(user);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // LOGIN
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<AuthTokenResponse> LoginAsync(
        LoginRequest request,
        CancellationToken ct = default)
    {
        if (!Enum.TryParse<UserRole>(
                request.Role,
                ignoreCase: true,
                out var role) ||
            role == UserRole.Patient)
        {
            throw DomainValidationException.For(
                nameof(request.Role),
                "Credential login is only available for Doctor and Admin roles.");
        }

        var normalizedEmail = request.Email.Trim().ToLower();

        var user = await db.Set<User>()
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail, ct)
            ?? throw new UnauthorizedException("Invalid credentials.", "INVALID_CREDENTIALS");

        if (!user.IsActive)
        {
            throw new UnauthorizedException(
                "Account is pending admin approval.",
                "ACCOUNT_INACTIVE");
        }

        // IMPORTANT:
        // Doctor/Admin credential login DOES NOT require OTP verification.
        // OTP verification is only used for patient OTP login flow.

        if (user.Role != role)
        {
            throw new UnauthorizedException("Invalid credentials.", "INVALID_CREDENTIALS");
        }

        var validPassword = passwordService.Verify(
            request.Password,
            user.PasswordHash);

        if (!validPassword)
        {
            logger.LogWarning("Login failed: invalid password. UserId={UserId} Role={Role}", user.Id, role);
            throw new UnauthorizedException("Invalid credentials.", "INVALID_CREDENTIALS");
        }

        logger.LogInformation("Login successful. UserId={UserId} Role={Role}", user.Id, role);
        return await IssueTokenPairAsync(user, ct);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SEND OTP  (Patient phone-based authentication)
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<OtpResponse> SendOtpAsync(
        SendOtpRequest request,
        CancellationToken ct = default)
    {
        var normalizedPhone = request.PhoneNumber.Trim();

        var user = await db.Set<User>()
            .FirstOrDefaultAsync(u => u.PhoneNumber == normalizedPhone, ct);

        // Auto-create lightweight Patient account on first OTP request.
        if (user is null)
        {
            user = new User
            {
                FullName = string.Empty,   // filled during Patient profile creation
                Email = null,              // phone-only patients have no email
                PhoneNumber = normalizedPhone,
                PasswordHash = string.Empty,

                Role = UserRole.Patient,

                IsActive = true,
                IsVerified = false,

                CreatedAt = DateTime.UtcNow
            };

            db.Set<User>().Add(user);
        }
        else if (user.Role != UserRole.Patient)
        {
            // Doctors/Admins must not use the OTP flow.
            throw DomainValidationException.For(
                nameof(request.PhoneNumber),
                "This phone number is associated with a non-patient account. Use email/password login.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedException(
                "Account is deactivated. Please contact support.",
                "ACCOUNT_INACTIVE");
        }

        user.OtpCode = otpService.Generate();
        user.OtpExpiresAt = otpService.GetExpiry();
        user.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "[OTP-SEND] Stored. Phone={Phone} UserId={UserId} ExpiresAt={ExpiresAt}",
            normalizedPhone, user.Id, user.OtpExpiresAt!.Value.ToString("O"));

        return new OtpResponse(
            "OTP sent successfully. Valid for 5 minutes.",
            user.OtpExpiresAt.Value);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // VERIFY OTP  (Patient phone-based authentication)
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<AuthTokenResponse> VerifyOtpAsync(
        VerifyOtpRequest request,
        CancellationToken ct = default)
    {
        var normalizedPhone = request.PhoneNumber.Trim();

        var user = await db.Set<User>()
            .FirstOrDefaultAsync(u => u.PhoneNumber == normalizedPhone, ct)
            ?? throw new UnauthorizedException("Invalid credentials.", "INVALID_CREDENTIALS");

        if (!user.IsActive)
        {
            throw new UnauthorizedException(
                "Account is deactivated. Please contact support.",
                "ACCOUNT_INACTIVE");
        }

        // Log the OTP verification attempt so developers can confirm the session lifecycle.
        // Expected in normal flow:  PendingOtp=True
        // NO_PENDING_OTP scenario:  PendingOtp=False — send-otp must be called first.
        logger.LogInformation(
            "[OTP-VERIFY] Attempt. Phone={Phone} UserId={UserId} PendingOtp={HasPending}",
            normalizedPhone, user.Id, user.OtpCode is not null);

        if (user.OtpCode is null || user.OtpExpiresAt is null)
        {
            logger.LogWarning(
                "[OTP-VERIFY] NO_PENDING_OTP. Phone={Phone} UserId={UserId}. OTP was consumed or send-otp was never called.",
                normalizedPhone, user.Id);
            throw new UnauthorizedException(
                "No pending OTP found. Please request a new OTP.",
                "NO_PENDING_OTP");
        }

        if (DateTime.UtcNow > user.OtpExpiresAt.Value)
        {
            throw new UnauthorizedException(
                "OTP has expired. Please request a new one.",
                "OTP_EXPIRED");
        }

        var validOtp = otpService.IsValid(
            user.OtpCode,
            user.OtpExpiresAt.Value,
            request.Otp);

        if (!validOtp)
        {
            logger.LogWarning("OTP verification failed: invalid code. UserId={UserId}", user.Id);
            throw new UnauthorizedException("Invalid OTP code.", "INVALID_OTP");
        }

        user.OtpCode = null;
        user.OtpExpiresAt = null;

        user.IsVerified = true;

        user.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        logger.LogInformation("OTP verified. Patient login successful. UserId={UserId}", user.Id);

        return await IssueTokenPairAsync(user, ct);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // REFRESH TOKEN
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<AuthTokenResponse> RefreshTokenAsync(
        RefreshTokenRequest request,
        CancellationToken ct = default)
    {
        var hashedToken = HashToken(request.RefreshToken);

        var user = await db.Set<User>()
            .FirstOrDefaultAsync(
                u => u.RefreshToken == hashedToken,
                ct)
            ?? throw new UnauthorizedException(
                "Invalid or expired refresh token.",
                "INVALID_REFRESH_TOKEN");

        if (!user.IsActive)
        {
            throw new UnauthorizedException(
                "Account is deactivated.",
                "ACCOUNT_INACTIVE");
        }

        if (user.RefreshTokenExpiresAt is null ||
            DateTime.UtcNow > user.RefreshTokenExpiresAt.Value)
        {
            throw new UnauthorizedException(
                "Refresh token has expired. Please log in again.",
                "REFRESH_TOKEN_EXPIRED");
        }

        return await IssueTokenPairAsync(user, ct);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // LOGOUT
    // ──────────────────────────────────────────────────────────────────────────

    public async Task LogoutAsync(
        Guid userId,
        string refreshToken,
        CancellationToken ct = default)
    {
        var user = await db.Set<User>()
            .FindAsync(new object[] { userId }, ct)
            ?? throw NotFoundException.For("User", userId);

        user.RefreshToken = null;
        user.RefreshTokenExpiresAt = null;

        user.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET CURRENT USER
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<UserProfileDto> GetCurrentUserAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var user = await db.Set<User>()
            .FindAsync(new object[] { userId }, ct)
            ?? throw NotFoundException.For("User", userId);

        return mapper.Map<UserProfileDto>(user);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // UPDATE PROFILE
    // ──────────────────────────────────────────────────────────────────────────

    public async Task<UserProfileDto> UpdateProfileAsync(
        Guid userId,
        UpdateProfileRequest request,
        CancellationToken ct = default)
    {
        var user = await db.Set<User>()
            .FindAsync(new object[] { userId }, ct)
            ?? throw NotFoundException.For("User", userId);

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber) &&
            request.PhoneNumber != user.PhoneNumber)
        {
            var phoneTaken = await db.Set<User>()
                .AnyAsync(
                    u => u.PhoneNumber == request.PhoneNumber &&
                         u.Id != userId,
                    ct);

            if (phoneTaken)
            {
                throw new ConflictException(
                    "Phone number is already in use by another account.");
            }
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            user.FullName = request.FullName.Trim();
        }

        if (request.PhoneNumber is not null)
        {
            user.PhoneNumber = request.PhoneNumber.Trim();
        }

        user.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        return mapper.Map<UserProfileDto>(user);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ──────────────────────────────────────────────────────────────────────────

    private async Task<AuthTokenResponse> IssueTokenPairAsync(
        User user,
        CancellationToken ct)
    {
        var role = user.Role.ToString();

        var accessToken = jwtGenerator.GenerateToken(
            user.Id,
            user.Email ?? user.PhoneNumber,  // phone-only patients use phone as identifier
            role);

        var rawRefreshToken = Guid.NewGuid().ToString();

        user.RefreshToken = HashToken(rawRefreshToken);

        user.RefreshTokenExpiresAt =
            DateTime.UtcNow.AddDays(
                AppConstants.RefreshTokenExpiryDays);

        user.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        return new AuthTokenResponse(
            AccessToken: accessToken,
            RefreshToken: rawRefreshToken,
            ExpiresIn: AppConstants.JwtExpiryMinutes * 60,
            TokenType: "Bearer",
            User: mapper.Map<UserProfileDto>(user));
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(
            Encoding.UTF8.GetBytes(token));

        return Convert.ToBase64String(bytes);
    }
}