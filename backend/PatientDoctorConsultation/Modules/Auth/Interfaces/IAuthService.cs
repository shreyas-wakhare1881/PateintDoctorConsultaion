namespace PatientDoctorConsultation.Modules.Auth.Interfaces;

public interface IAuthService
{
    Task<string> LoginAsync(string email, string password, CancellationToken cancellationToken = default);
    Task<bool> VerifyOtpAsync(string email, string otp, CancellationToken cancellationToken = default);
    Task SendOtpAsync(string email, CancellationToken cancellationToken = default);
}
