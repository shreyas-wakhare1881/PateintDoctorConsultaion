namespace PatientDoctorConsultation.Shared.Exceptions;

public sealed class NotFoundException(string message) : Exception(message)
{
    public static NotFoundException For(string entity, object id)
        => new($"{entity} with id '{id}' was not found.");
}
