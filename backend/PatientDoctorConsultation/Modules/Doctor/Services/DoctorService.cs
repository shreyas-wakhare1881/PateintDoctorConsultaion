using PatientDoctorConsultation.Modules.Doctor.Interfaces;

namespace PatientDoctorConsultation.Modules.Doctor.Services;

public class DoctorService : IDoctorService
{
    public Task<object?> GetProfileAsync(Guid doctorId, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task SetAvailabilityAsync(Guid doctorId, object schedule, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();
}
