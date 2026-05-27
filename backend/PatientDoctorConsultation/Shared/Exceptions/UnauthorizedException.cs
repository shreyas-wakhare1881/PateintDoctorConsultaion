namespace PatientDoctorConsultation.Shared.Exceptions;

/// <summary>
/// Thrown when a request cannot be authenticated or the caller lacks the required identity.
/// <paramref name="code"/> is a machine-readable token the frontend uses to map to
/// a user-friendly message without parsing the human <paramref name="message"/>.
/// </summary>
public sealed class UnauthorizedException(
    string message = "Unauthorized access.",
    string? code = null) : Exception(message)
{
    /// <summary>Machine-readable error code (e.g. "INVALID_OTP", "OTP_EXPIRED").</summary>
    public string? Code { get; } = code;
}
