namespace PatientDoctorConsultation.Modules.Patient.Interfaces;

public interface IPatientService
{
    Task<object?> GetProfileAsync(Guid patientId, CancellationToken cancellationToken = default);
    Task UpdateProfileAsync(Guid patientId, object request, CancellationToken cancellationToken = default);
}
