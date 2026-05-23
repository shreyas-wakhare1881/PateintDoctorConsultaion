using System.Security.Cryptography;
using PatientDoctorConsultation.Shared.Constants;

namespace PatientDoctorConsultation.Infrastructure.Identity.OTP;

public interface IOtpService
{
    string Generate();
    DateTime GetExpiry();
    bool IsValid(string stored, DateTime storedExpiry, string provided);
}

public sealed class OtpService : IOtpService
{
    public string Generate()
        => RandomNumberGenerator.GetInt32(100_000, 999_999).ToString();

    public DateTime GetExpiry()
        => DateTime.UtcNow.AddMinutes(AppConstants.OtpExpiryMinutes);

    public bool IsValid(string stored, DateTime storedExpiry, string provided)
        => stored == provided && DateTime.UtcNow <= storedExpiry;
}
