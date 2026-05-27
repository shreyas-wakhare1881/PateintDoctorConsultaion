namespace PatientDoctorConsultation.Shared.Responses;

public sealed class ApiResponse<T>
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    /// <summary>
    /// Machine-readable error code. Populated only on error responses.
    /// Allows the frontend to show localised, user-friendly messages without
    /// string-parsing the human-readable <see cref="Message"/>.
    /// </summary>
    public string? Code { get; init; }
    public T? Data { get; init; }
    public IReadOnlyDictionary<string, string[]>? Errors { get; init; }

    public static ApiResponse<T> Ok(T data, string? message = null)
        => new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(
        string message,
        IReadOnlyDictionary<string, string[]>? errors = null,
        string? code = null)
        => new() { Success = false, Message = message, Code = code, Errors = errors };
}

public sealed class ApiResponse
{
    public bool Success { get; init; }
    public string? Message { get; init; }
    /// <summary>Machine-readable error code. Populated only on error responses.</summary>
    public string? Code { get; init; }

    public static ApiResponse Ok(string? message = null) => new() { Success = true, Message = message };
    public static ApiResponse Fail(string message, string? code = null)
        => new() { Success = false, Message = message, Code = code };
}
