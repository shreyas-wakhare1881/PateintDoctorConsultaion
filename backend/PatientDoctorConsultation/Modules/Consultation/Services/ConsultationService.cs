using PatientDoctorConsultation.Modules.Consultation.Interfaces;

namespace PatientDoctorConsultation.Modules.Consultation.Services;

public class ConsultationService : IConsultationService
{
    public Task<object?> BookAsync(object request, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task<object?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task CompleteAsync(Guid id, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();
}
