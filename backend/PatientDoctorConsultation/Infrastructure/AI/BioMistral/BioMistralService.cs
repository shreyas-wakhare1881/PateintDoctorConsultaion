using PatientDoctorConsultation.Infrastructure.AI.Ollama;
using PatientDoctorConsultation.Infrastructure.AI.PromptTemplates;

namespace PatientDoctorConsultation.Infrastructure.AI.BioMistral;

public interface IBioMistralService
{
    Task<string> SummarizeConsultationAsync(string transcriptText, CancellationToken ct = default);
}

public sealed class BioMistralService(IOllamaClient ollamaClient) : IBioMistralService
{
    private const string ModelName = "biomistral";

    public async Task<string> SummarizeConsultationAsync(string transcriptText, CancellationToken ct = default)
    {
        var prompt = SummaryPromptTemplate.Build(transcriptText);
        return await ollamaClient.GenerateAsync(ModelName, prompt, ct);
    }
}
