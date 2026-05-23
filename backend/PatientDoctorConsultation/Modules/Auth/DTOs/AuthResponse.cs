namespace PatientDoctorConsultation.Modules.Auth.DTOs;

public sealed record AuthTokenResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    string Role,
    Guid UserId
);

public sealed record OtpResponse(string Message, DateTime ExpiresAt);
