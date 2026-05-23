using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;
using PatientDoctorConsultation.Shared.Constants;

namespace PatientDoctorConsultation.Infrastructure.Identity.OTP;

public interface IOtpService
{
    string Generate();
    DateTime GetExpiry();
    bool IsValid(string stored, DateTime storedExpiry, string provided);
}

public sealed class OtpService(IConfiguration configuration) : IOtpService
{
    /// <summary>
    /// Generates an OTP. In non-production environments, returns the fixed code
    /// from Otp:DevFixedCode config key (if set) to simplify Swagger testing.
    /// </summary>
    public string Generate()
    {
        var devCode = configuration["Otp:DevFixedCode"];
        return !string.IsNullOrWhiteSpace(devCode)
            ? devCode
            : RandomNumberGenerator.GetInt32(100_000, 999_999).ToString();
    }

    public DateTime GetExpiry() => DateTime.UtcNow.AddMinutes(AppConstants.OtpExpiryMinutes);

    public bool IsValid(string stored, DateTime storedExpiry, string provided)
        => stored == provided && DateTime.UtcNow <= storedExpiry;
}
