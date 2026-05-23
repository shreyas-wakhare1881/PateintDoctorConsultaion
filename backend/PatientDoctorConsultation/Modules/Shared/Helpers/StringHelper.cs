using System.Text.RegularExpressions;

namespace PatientDoctorConsultation.Modules.Shared.Helpers;

public static class StringHelper
{
    public static string ToSlug(string text)
    {
        text = text.ToLowerInvariant().Trim();
        text = Regex.Replace(text, @"\s+", "-");
        text = Regex.Replace(text, @"[^a-z0-9\-]", string.Empty);
        return text;
    }

    public static string MaskEmail(string email)
    {
        var parts = email.Split('@');
        if (parts.Length != 2) return "***";
        var name = parts[0];
        var masked = name.Length <= 2 ? "**" : $"{name[0]}***{name[^1]}";
        return $"{masked}@{parts[1]}";
    }

    public static bool IsValidEmail(string email)
        => Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
}
