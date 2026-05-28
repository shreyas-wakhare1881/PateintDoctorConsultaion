using PatientDoctorConsultation.Shared.Common;

namespace PatientDoctorConsultation.Modules.Prescription.Models;

public class Prescription : BaseAuditableEntity
{
    public Guid ConsultationId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid PatientId { get; set; }
    public string? Diagnosis { get; set; }
    public string? GeneralInstructions { get; set; }
    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

    public ICollection<PrescriptionItem> Items { get; set; } = [];
}
