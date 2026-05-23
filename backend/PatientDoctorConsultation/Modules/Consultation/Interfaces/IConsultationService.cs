namespace PatientDoctorConsultation.Modules.Consultation.Interfaces;

public interface IConsultationService
{
    Task<object?> BookAsync(object request, CancellationToken cancellationToken = default);
    Task<object?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task CompleteAsync(Guid id, CancellationToken cancellationToken = default);
}
