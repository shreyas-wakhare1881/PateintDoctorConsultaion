namespace PatientDoctorConsultation.Modules.Doctor.Interfaces;

public interface IDoctorService
{
    Task<object?> GetProfileAsync(Guid doctorId, CancellationToken cancellationToken = default);
    Task SetAvailabilityAsync(Guid doctorId, object schedule, CancellationToken cancellationToken = default);
}
