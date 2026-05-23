namespace PatientDoctorConsultation.Shared.Config;

/// <summary>LiveKit video call configuration — lives in Shared to allow Infrastructure
/// layer access without circular dependencies.</summary>
public sealed class LiveKitConfig
{
    public string ApiKey { get; set; } = string.Empty;
    public string ApiSecret { get; set; } = string.Empty;
    public string Host { get; set; } = string.Empty;
}
