namespace PatientDoctorConsultation.Modules.Shared.Interfaces;

/// <summary>
/// Abstraction that allows the Auth module to create a Doctor stub row
/// at registration time without a direct compile-time dependency on the Doctor module.
/// </summary>
public interface IDoctorStubCreator
{
    /// <summary>
    /// Creates a pending Doctor stub for the given user ID within the same
    /// ambient EF Core transaction / SaveChangesAsync call.
    /// </summary>
    Task CreateStubAsync(Guid userId, CancellationToken ct = default);
}
