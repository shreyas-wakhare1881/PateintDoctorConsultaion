namespace PatientDoctorConsultation.API.Middleware;

public class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        logger.LogInformation("[{Method}] {Path} started", context.Request.Method, context.Request.Path);
        await next(context);
        logger.LogInformation("[{Method}] {Path} completed with {StatusCode}",
            context.Request.Method, context.Request.Path, context.Response.StatusCode);
    }
}
