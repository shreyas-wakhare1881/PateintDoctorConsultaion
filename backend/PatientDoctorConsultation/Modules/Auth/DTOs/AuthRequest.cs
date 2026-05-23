namespace PatientDoctorConsultation.Modules.Auth.DTOs;

public sealed record RegisterRequest(
    string FullName,
    string Email,
    string? PhoneNumber,
    string Password,
    string ConfirmPassword,
    string Role
);

public sealed record LoginRequest(
    string Email,
    string Password,
    string Role
);

public sealed record SendOtpRequest(string Email);

public sealed record VerifyOtpRequest(string Email, string Otp);

public sealed record RefreshTokenRequest(string RefreshToken);

public sealed record UpdateProfileRequest(
    string? FullName,
    string? PhoneNumber
);
