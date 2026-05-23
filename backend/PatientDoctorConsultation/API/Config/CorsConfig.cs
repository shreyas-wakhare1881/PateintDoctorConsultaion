namespace PatientDoctorConsultation.API.Config;

public class CorsConfig
{
    public string[] AllowedOrigins { get; set; } = ["http://localhost:3000"];
}
