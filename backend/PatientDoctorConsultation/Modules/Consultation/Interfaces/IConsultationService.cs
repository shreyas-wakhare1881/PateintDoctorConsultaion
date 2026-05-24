using PatientDoctorConsultation.Modules.Consultation.DTOs;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.Consultation.Interfaces;

public interface IConsultationService
{
    // ── Patient ───────────────────────────────────────────────────────────────
    Task<ConsultationDetailsResponse> BookConsultationAsync(Guid userId, BookConsultationRequest request, CancellationToken ct = default);
    Task<PaginatedResponse<ConsultationSummaryResponse>> GetMyConsultationsAsync(Guid userId, ConsultationListQuery query, CancellationToken ct = default);
    Task<ConsultationDetailsResponse> CancelConsultationAsync(Guid userId, string userRole, Guid consultationId, CancelConsultationRequest request, CancellationToken ct = default);

    // ── Doctor ────────────────────────────────────────────────────────────────
    Task<PaginatedResponse<ConsultationSummaryResponse>> GetConsultationRequestsAsync(Guid userId, ConsultationListQuery query, CancellationToken ct = default);
    Task<ConsultationDetailsResponse> ConfirmConsultationAsync(Guid userId, Guid consultationId, CancellationToken ct = default);
    Task<ConsultationDetailsResponse> RejectConsultationAsync(Guid userId, Guid consultationId, RejectConsultationRequest request, CancellationToken ct = default);
    Task<PaginatedResponse<ConsultationSummaryResponse>> GetDoctorScheduleAsync(Guid userId, DoctorScheduleQuery query, CancellationToken ct = default);
    Task<ConsultationDetailsResponse> MarkInProgressAsync(Guid userId, Guid consultationId, CancellationToken ct = default);
    Task<ConsultationDetailsResponse> MarkCompletedAsync(Guid userId, Guid consultationId, CompleteConsultationRequest request, CancellationToken ct = default);

    // ── Shared ────────────────────────────────────────────────────────────────
    Task<ConsultationDetailsResponse> GetConsultationByIdAsync(Guid userId, string userRole, Guid consultationId, CancellationToken ct = default);
    Task<IReadOnlyList<ConsultationStatusHistoryResponse>> GetStatusHistoryAsync(Guid userId, string userRole, Guid consultationId, CancellationToken ct = default);

    // ── Admin ─────────────────────────────────────────────────────────────────
    Task<PaginatedResponse<ConsultationSummaryResponse>> GetAllConsultationsAsync(AdminConsultationQuery query, CancellationToken ct = default);
}

