using Microsoft.AspNetCore.Hosting;

namespace PatientDoctorConsultation.Infrastructure.Storage.Local;

public interface ILocalStorageService
{
    Task<string> SaveFileAsync(Stream fileStream, string fileName, string folder, CancellationToken ct = default);
    Task DeleteFileAsync(string filePath, CancellationToken ct = default);
    string GetPublicUrl(string filePath);
}

public sealed class LocalStorageService(IWebHostEnvironment env) : ILocalStorageService
{
    public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string folder, CancellationToken ct = default)
    {
        var uploadPath = Path.Combine(env.WebRootPath, "uploads", folder);
        Directory.CreateDirectory(uploadPath);

        var safeFileName = $"{Guid.NewGuid():N}_{Path.GetFileName(fileName)}";
        var fullPath = Path.Combine(uploadPath, safeFileName);

        await using var output = File.Create(fullPath);
        await fileStream.CopyToAsync(output, ct);

        return Path.Combine("uploads", folder, safeFileName).Replace('\\', '/');
    }

    public Task DeleteFileAsync(string filePath, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(env.WebRootPath, filePath);
        if (File.Exists(fullPath)) File.Delete(fullPath);
        return Task.CompletedTask;
    }

    public string GetPublicUrl(string filePath) => $"/{filePath.Replace('\\', '/')}";
}
