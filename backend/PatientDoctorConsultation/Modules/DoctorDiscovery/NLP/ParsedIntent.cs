namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP;

/// <summary>
/// Structured result produced by <see cref="IIntentParser"/> from a free-text patient query.
/// All fields are null when not found in the query.
/// Immutable record — produced once, consumed downstream.
/// </summary>
public sealed record ParsedIntent
{
    /// <summary>Canonical medical specialization extracted from the query (e.g., "Cardiologist").</summary>
    public string? Specialization { get; init; }

    /// <summary>City name in canonical form (e.g., "Mumbai" — not "bombay").</summary>
    public string? City { get; init; }

    /// <summary>Language preference (e.g., "Marathi").</summary>
    public string? Language { get; init; }

    /// <summary>Maximum consultation fee parsed from patterns like "under 1000", "below ₹500".</summary>
    public decimal? MaxConsultationFee { get; init; }

    /// <summary>Minimum consultation fee parsed from patterns like "above 500", "minimum 200".</summary>
    public decimal? MinConsultationFee { get; init; }

    /// <summary>Minimum experience in years from patterns like "10 years experience", "5+ years".</summary>
    public int? MinExperience { get; init; }

    /// <summary>Maximum experience in years (rarely used; parsed from "less than 5 years exp").</summary>
    public int? MaxExperience { get; init; }

    /// <summary>"Female" | "Male" | null — extracted from gender keywords.</summary>
    public string? Gender { get; init; }

    /// <summary>
    /// Tokens remaining after all entities have been extracted and stop words removed.
    /// Used as a fallback SearchTerm for name/bio searches (e.g., "Dr. Sharma").
    /// Null when nothing meaningful remains.
    /// </summary>
    public string? RemainingQuery { get; init; }

    /// <summary>
    /// Confidence score [0.0–1.0] indicating how well the intent was understood.
    ///
    /// Scoring model:
    ///   — 0.78+ : Specialization found via direct synonym (user asked for a doctor type)
    ///   — 0.55  : Specialization found via symptom/disease inference
    ///   — 0.20  : Nothing extracted (empty query or unrecognized terms)
    ///   — Additional entities (city, language, fee, experience) add incremental confidence.
    ///
    /// Used for: analytics quality tracking, UI confidence badges, future AI training.
    /// </summary>
    public double ConfidenceScore { get; init; }

    /// <summary>Returns true if no intent could be extracted from the query.</summary>
    public bool IsEmpty =>
        Specialization is null &&
        City is null &&
        Language is null &&
        MaxConsultationFee is null &&
        MinConsultationFee is null &&
        MinExperience is null &&
        MaxExperience is null &&
        Gender is null;
}
