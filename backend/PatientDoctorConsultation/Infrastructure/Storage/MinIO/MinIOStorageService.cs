namespace PatientDoctorConsultation.Infrastructure.Storage.MinIO;

public interface IMinIOStorageService
{
    Task<string> UploadAsync(Stream stream, string objectName, string contentType, CancellationToken ct = default);
    Task<string> GetPresignedUrlAsync(string objectName, int expirySeconds = 3600, CancellationToken ct = default);
    Task DeleteAsync(string objectName, CancellationToken ct = default);
}

/// <summary>
/// MinIO object storage service — implement using Minio .NET SDK.
/// Configure bucket name and endpoint in appsettings.json.
/// </summary>
public sealed class MinIOStorageService : IMinIOStorageService
{
    public Task<string> UploadAsync(Stream stream, string objectName, string contentType, CancellationToken ct = default)
        => throw new NotImplementedException("Implement with Minio .NET SDK.");

    public Task<string> GetPresignedUrlAsync(string objectName, int expirySeconds = 3600, CancellationToken ct = default)
        => throw new NotImplementedException("Implement with Minio .NET SDK.");

    public Task DeleteAsync(string objectName, CancellationToken ct = default)
        => throw new NotImplementedException("Implement with Minio .NET SDK.");
}
