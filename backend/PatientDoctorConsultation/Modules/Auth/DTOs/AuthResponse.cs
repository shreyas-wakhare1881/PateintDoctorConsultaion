namespace PatientDoctorConsultation.Modules.Auth.DTOs;

public sealed record AuthTokenResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    string TokenType,
    UserProfileDto User
);

public sealed record UserProfileDto(
    Guid Id,
    string FullName,
    string? Email,
    string? PhoneNumber,
    string Role,
    bool IsActive,
    bool IsVerified,
    DateTime CreatedAt
);

public sealed record OtpResponse(string Message, DateTime ExpiresAt);
