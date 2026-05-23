using PatientDoctorConsultation.Modules.Auth.Interfaces;

namespace PatientDoctorConsultation.Modules.Auth.Services;

public class AuthService : IAuthService
{
    public Task<string> LoginAsync(string email, string password, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task<bool> VerifyOtpAsync(string email, string otp, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task SendOtpAsync(string email, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();
}
