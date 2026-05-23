using System.Net;
using System.Text.Json;
using PatientDoctorConsultation.Shared.Exceptions;
using PatientDoctorConsultation.Shared.Responses;

namespace PatientDoctorConsultation.API.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    private static readonly JsonSerializerOptions JsonOptions =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (DomainValidationException ex)
        {
            logger.LogWarning("Validation error: {Message}", ex.Message);
            await WriteAsync(context, HttpStatusCode.BadRequest,
                ApiResponse<object>.Fail(ex.Message, ex.Errors));
        }
        catch (ConflictException ex)
        {
            logger.LogWarning("Conflict: {Message}", ex.Message);
            await WriteAsync(context, HttpStatusCode.Conflict, ApiResponse.Fail(ex.Message));
        }
        catch (NotFoundException ex)
        {
            logger.LogWarning("Not found: {Message}", ex.Message);
            await WriteAsync(context, HttpStatusCode.NotFound, ApiResponse.Fail(ex.Message));
        }
        catch (UnauthorizedException ex)
        {
            logger.LogWarning("Unauthorized: {Message}", ex.Message);
            await WriteAsync(context, HttpStatusCode.Unauthorized, ApiResponse.Fail(ex.Message));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            await WriteAsync(context, HttpStatusCode.InternalServerError,
                ApiResponse.Fail("An unexpected error occurred."));
        }
    }

    private static async Task WriteAsync(HttpContext context, HttpStatusCode status, object body)
    {
        context.Response.StatusCode  = (int)status;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(JsonSerializer.Serialize(body, JsonOptions));
    }
}
