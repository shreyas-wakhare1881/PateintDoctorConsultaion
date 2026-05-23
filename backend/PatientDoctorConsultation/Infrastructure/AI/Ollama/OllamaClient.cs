using System.Net.Http.Json;

namespace PatientDoctorConsultation.Infrastructure.AI.Ollama;

public interface IOllamaClient
{
    Task<string> GenerateAsync(string model, string prompt, CancellationToken ct = default);
}

public sealed class OllamaClient(HttpClient httpClient) : IOllamaClient
{
    public async Task<string> GenerateAsync(string model, string prompt, CancellationToken ct = default)
    {
        var payload = new { model, prompt, stream = false };
        var response = await httpClient.PostAsJsonAsync("/api/generate", payload, ct);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<OllamaGenerateResponse>(cancellationToken: ct);
        return result?.Response ?? string.Empty;
    }
}

internal sealed record OllamaGenerateResponse(string Response, bool Done);
