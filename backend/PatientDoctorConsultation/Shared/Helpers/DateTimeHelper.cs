namespace PatientDoctorConsultation.Shared.Helpers;

public static class DateTimeHelper
{
    public static DateTime UtcNow() => DateTime.UtcNow;

    public static bool IsExpired(DateTime expiresAt) => DateTime.UtcNow > expiresAt;

    public static DateTime AddMinutes(int minutes) => DateTime.UtcNow.AddMinutes(minutes);

    public static string ToIso8601(DateTime dateTime) => dateTime.ToString("yyyy-MM-ddTHH:mm:ssZ");

    public static TimeSpan GetDuration(DateTime start, DateTime end) => end - start;
}
