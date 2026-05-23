using PatientDoctorConsultation.Modules.Auth.DTOs;

namespace PatientDoctorConsultation.Modules.Auth.Interfaces;

public interface IAuthService
{
    Task<UserProfileDto> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<AuthTokenResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<OtpResponse> SendOtpAsync(SendOtpRequest request, CancellationToken ct = default);
    Task<AuthTokenResponse> VerifyOtpAsync(VerifyOtpRequest request, CancellationToken ct = default);
    Task<AuthTokenResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken ct = default);
    Task LogoutAsync(Guid userId, string refreshToken, CancellationToken ct = default);
    Task<UserProfileDto> GetCurrentUserAsync(Guid userId, CancellationToken ct = default);
    Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken ct = default);
}
