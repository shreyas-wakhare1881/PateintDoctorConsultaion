namespace PatientDoctorConsultation.Shared.Helpers;

public static class StringHelper
{
    public static string ToSlug(string value)
        => value.ToLowerInvariant().Replace(" ", "-");

    public static string Mask(string value, int visibleChars = 3)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length <= visibleChars)
            return "***";
        return string.Concat(value.AsSpan(0, visibleChars), new string('*', value.Length - visibleChars));
    }

    public static bool IsValidEmail(string email)
        => !string.IsNullOrWhiteSpace(email) && email.Contains('@') && email.Contains('.');

    public static string GenerateRoomId()
        => Guid.NewGuid().ToString("N")[..12];
}
