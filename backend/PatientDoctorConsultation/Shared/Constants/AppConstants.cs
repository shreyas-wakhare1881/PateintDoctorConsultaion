namespace PatientDoctorConsultation.Shared.Constants;

public static class AppConstants
{
    public const string DefaultAdminEmail = "admin@pdc.health";
    public const int OtpExpiryMinutes = 5;
    public const int JwtExpiryMinutes = 60;
    public const int RefreshTokenExpiryDays = 7;
    public const int MaxFileUploadSizeMb = 10;
    public const string DateTimeFormat = "yyyy-MM-ddTHH:mm:ssZ";
    public const string DefaultPaginationPageSize = "10";
}
