namespace PatientDoctorConsultation.Infrastructure.AI.PromptTemplates;

public static class SummaryPromptTemplate
{
    public static string Build(string transcriptText) =>
        $"""
        You are a medical assistant AI. Analyze the following doctor-patient consultation transcript
        and provide a concise clinical summary including:
        - Chief complaint
        - Key symptoms mentioned
        - Diagnosis or assessment (if mentioned)
        - Recommended treatment or follow-up actions

        Transcript:
        {transcriptText}

        Provide the summary in plain clinical language.
        """;
}
