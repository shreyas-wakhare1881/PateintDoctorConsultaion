namespace PatientDoctorConsultation.Shared.Exceptions;

public sealed class UnauthorizedException(string message = "Unauthorized access.") : Exception(message);
