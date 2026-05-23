namespace PatientDoctorConsultation.Modules.Auth.DTOs;

public sealed record LoginRequest(
    string Email,
    string Password,
    string Role
);

public sealed record SendOtpRequest(string Email);

public sealed record VerifyOtpRequest(string Email, string Otp);
