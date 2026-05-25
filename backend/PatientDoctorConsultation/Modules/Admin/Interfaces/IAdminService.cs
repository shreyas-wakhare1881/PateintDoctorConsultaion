using PatientDoctorConsultation.Modules.Admin.DTOs;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.Admin.Interfaces;

public interface IAdminService
{
    // ── Dashboard ─────────────────────────────────────────────────────────────
    Task<AdminDashboardResponse> GetDashboardAsync(CancellationToken ct = default);

    // ── Doctor Moderation ─────────────────────────────────────────────────────
    Task<PaginatedResponse<AdminPendingDoctorItem>> GetPendingDoctorsAsync(int page, int pageSize, CancellationToken ct = default);
    Task<PaginatedResponse<AdminDoctorListItem>> GetAllDoctorsAsync(AdminDoctorListQuery query, CancellationToken ct = default);
    Task<DoctorModerationResponse> ApproveDoctorAsync(Guid adminId, Guid doctorId, DoctorModerationRequest request, CancellationToken ct = default);
    Task<DoctorModerationResponse> RejectDoctorAsync(Guid adminId, Guid doctorId, DoctorModerationRequest request, CancellationToken ct = default);
    Task<DoctorModerationResponse> SuspendDoctorAsync(Guid adminId, Guid doctorId, DoctorModerationRequest request, CancellationToken ct = default);
    Task<DoctorModerationResponse> ReactivateDoctorAsync(Guid adminId, Guid doctorId, DoctorModerationRequest request, CancellationToken ct = default);

    // ── Patient Moderation ────────────────────────────────────────────────────
    Task<PaginatedResponse<AdminPatientListItem>> GetAllPatientsAsync(AdminPatientListQuery query, CancellationToken ct = default);
    Task<PatientModerationResponse> BlockPatientAsync(Guid adminId, Guid patientUserId, PatientModerationRequest request, CancellationToken ct = default);
    Task<PatientModerationResponse> UnblockPatientAsync(Guid adminId, Guid patientUserId, PatientModerationRequest request, CancellationToken ct = default);

    // ── Consultation Monitoring ───────────────────────────────────────────────
    Task<PaginatedResponse<AdminConsultationListItem>> GetAllConsultationsAsync(AdminConsultationListQuery query, CancellationToken ct = default);
    Task<AdminConsultationDetail> GetConsultationDetailAsync(Guid consultationId, CancellationToken ct = default);

    // ── Audit Logs ────────────────────────────────────────────────────────────
    Task<PaginatedResponse<AdminAuditLogListItem>> GetAuditLogsAsync(AdminAuditLogQuery query, CancellationToken ct = default);
}

