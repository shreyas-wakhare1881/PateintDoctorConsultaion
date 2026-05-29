using PatientDoctorConsultation.Modules.DoctorDiscovery.DTOs;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP;

/// <summary>
/// Central NLP search pipeline orchestrator.
///
/// Responsibility chain:
///   PatientQuery → IntentParser → MedicalSynonymEngine → DoctorSearchRequest
///   → DoctorDiscoveryService → PaginatedResults + ParsedIntentDto
///
/// Future LLM/Semantic Search will replace the IntentParser step —
/// the rest of the pipeline (DoctorDiscoveryService → DB) stays untouched.
/// </summary>
public interface INlpSearchService
{
    /// <summary>
    /// Executes the NLP search pipeline and persists a search analytics event.
    /// </summary>
    /// <param name="request">NLP search request with raw query + optional explicit overrides.</param>
    /// <param name="patientId">Authenticated patient ID for analytics. Null for anonymous searches.</param>
    /// <param name="ct">Cancellation token for the search operation.</param>
    Task<NlpSearchResponse> SearchAsync(
        NlpSearchRequest request,
        Guid? patientId,
        CancellationToken ct = default);
}
