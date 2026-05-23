using PatientDoctorConsultation.Shared.Common;

namespace PatientDoctorConsultation.Modules.Admin.Models;

public class AdminUser : BaseAuditableEntity
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public bool IsSuperAdmin { get; set; }
}
