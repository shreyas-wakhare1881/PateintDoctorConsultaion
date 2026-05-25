namespace PatientDoctorConsultation.Modules.Admin.Enums;

/// <summary>
/// Represents the type of governance action performed by an admin operator.
/// Used in AdminAuditLogs.ActionType — stored as string in the database.
/// </summary>
public enum AdminActionType
{
    DoctorApproved = 0,
    DoctorRejected = 1,
    DoctorSuspended = 2,
    DoctorReactivated = 3,
    PatientBlocked = 4,
    PatientUnblocked = 5
}
