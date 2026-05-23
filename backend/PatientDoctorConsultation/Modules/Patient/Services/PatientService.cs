using PatientDoctorConsultation.Modules.Patient.Interfaces;

namespace PatientDoctorConsultation.Modules.Patient.Services;

public class PatientService : IPatientService
{
    public Task<object?> GetProfileAsync(Guid patientId, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task UpdateProfileAsync(Guid patientId, object request, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();
}
