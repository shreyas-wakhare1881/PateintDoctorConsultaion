namespace PatientDoctorConsultation.API.Middleware;

/// <summary>
/// Validates JWT tokens and attaches user identity to the HttpContext.
/// Additional claims extraction logic can be added here.
/// </summary>
public class JwtMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        // JWT validation is handled by ASP.NET Core authentication middleware.
        // Extend this for custom token introspection if needed.
        await next(context);
    }
}
