using PatientDoctorConsultation.Shared.Common;
using PatientDoctorConsultation.Shared.Enums;

namespace PatientDoctorConsultation.Modules.Auth.Models;

public class User : BaseAuditableEntity
{
    public string FullName { get; set; } = string.Empty;

    // Null for phone-only patients; set for Doctor/Admin accounts.
    public string? Email { get; set; }

    public string PhoneNumber { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsVerified { get; set; }

    public string? OtpCode { get; set; }

    public DateTime? OtpExpiresAt { get; set; }

    public string? RefreshToken { get; set; }

    public DateTime? RefreshTokenExpiresAt { get; set; }
}