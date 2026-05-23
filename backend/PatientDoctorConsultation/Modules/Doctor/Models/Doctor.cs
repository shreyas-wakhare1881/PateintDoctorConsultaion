using PatientDoctorConsultation.Shared.Common;
using PatientDoctorConsultation.Shared.Enums;

namespace PatientDoctorConsultation.Modules.Doctor.Models;

public class Doctor : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public decimal ConsultationFee { get; set; }
    public DoctorAvailabilityStatus AvailabilityStatus { get; set; } = DoctorAvailabilityStatus.Offline;
    public bool IsVerifiedByAdmin { get; set; }
}
