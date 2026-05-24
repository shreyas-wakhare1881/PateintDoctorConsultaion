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
    /// <summary>
    /// Development/testing mode: always returns the fixed 4-digit OTP "1234".
    /// Replace this with a real SMS gateway + random generation before going to production.
    /// </summary>
    public string Generate() => "1234";

    public DateTime GetExpiry() => DateTime.UtcNow.AddMinutes(AppConstants.OtpExpiryMinutes);

    public bool IsValid(string stored, DateTime storedExpiry, string provided)
        => stored == provided && DateTime.UtcNow <= storedExpiry;
}
