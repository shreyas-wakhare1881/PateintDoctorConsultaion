using PatientDoctorConsultation.Shared.Common;

namespace PatientDoctorConsultation.Modules.Patient.Models;

public class Patient : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? BloodGroup { get; set; }
    public string? AvatarUrl { get; set; }
}
