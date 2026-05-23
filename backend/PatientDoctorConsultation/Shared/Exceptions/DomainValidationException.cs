namespace PatientDoctorConsultation.Shared.Exceptions;

public sealed class DomainValidationException(IReadOnlyDictionary<string, string[]> errors)
    : Exception("One or more validation errors occurred.")
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } = errors;

    public static DomainValidationException For(string field, string error)
        => new(new Dictionary<string, string[]> { { field, [error] } });
}
