namespace PatientDoctorConsultation.Modules.Admin.Enums;

/// <summary>
/// Represents the entity type that was the target of an admin governance action.
/// Used in AdminAuditLogs.TargetEntityType — stored as string in the database.
/// </summary>
public enum AdminTargetEntityType
{
    Doctor = 0,
    Patient = 1,
    Consultation = 2
}
