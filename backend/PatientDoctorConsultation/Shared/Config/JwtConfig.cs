namespace PatientDoctorConsultation.Shared.Config;

/// <summary>JWT authentication configuration — lives in Shared to avoid circular dependencies
/// between API and Infrastructure layers.</summary>
public sealed class JwtConfig
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; } = 60;
}
