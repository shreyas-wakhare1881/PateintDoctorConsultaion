namespace PatientDoctorConsultation.Modules.Admin.Interfaces;

public interface IAdminService
{
    Task<IEnumerable<object>> GetAllDoctorsAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<object>> GetAllConsultationsAsync(CancellationToken cancellationToken = default);
}
