namespace PatientDoctorConsultation.Shared.Exceptions;

/// <summary>
/// Thrown when an authenticated user attempts to access a resource they do not own
/// or do not have permission to act upon. Returns HTTP 403 Forbidden.
/// Distinguished from UnauthorizedException (401) which represents unauthenticated access.
/// </summary>
public sealed class ForbiddenException(string message = "Access denied.") : Exception(message);
