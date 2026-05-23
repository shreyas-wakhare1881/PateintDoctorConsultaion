using PatientDoctorConsultation.Modules.Admin.Interfaces;

namespace PatientDoctorConsultation.Modules.Admin.Services;

public class AdminService : IAdminService
{
    public Task<IEnumerable<object>> GetAllDoctorsAsync(CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task<IEnumerable<object>> GetAllConsultationsAsync(CancellationToken cancellationToken = default)
        => throw new NotImplementedException();
}
