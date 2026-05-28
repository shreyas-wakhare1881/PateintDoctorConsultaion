using PatientDoctorConsultation.Shared.Common;

namespace PatientDoctorConsultation.Modules.Prescription.Models;

public class PrescriptionItem : BaseAuditableEntity
{
    public Guid PrescriptionId { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
    public string? Instructions { get; set; }

    public Prescription Prescription { get; set; } = null!;
}
