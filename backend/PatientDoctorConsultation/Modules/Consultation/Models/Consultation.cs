using PatientDoctorConsultation.Shared.Common;
using PatientDoctorConsultation.Shared.Enums;

namespace PatientDoctorConsultation.Modules.Consultation.Models;

public class Consultation : BaseAuditableEntity
{
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public DateTime ScheduledAt { get; set; }
    public ConsultationStatus Status { get; set; } = ConsultationStatus.Pending;
    public string? RoomId { get; set; }
    public string? Symptoms { get; set; }
    public string? Notes { get; set; }
    public string? AiSummary { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
}
