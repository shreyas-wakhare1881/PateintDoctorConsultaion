namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP;

/// <summary>
/// Converts a free-text patient query into a structured <see cref="ParsedIntent"/>.
/// No external AI/NLP frameworks — deterministic regex + dictionary lookup.
/// </summary>
public interface IIntentParser
{
    /// <summary>
    /// Parses the raw query and extracts all recognizable entities:
    /// specialization, city, language, fee range, experience range, gender.
    /// Returns a <see cref="ParsedIntent"/> with null fields for anything not found.
    /// Never throws — returns an empty intent on malformed input.
    /// </summary>
    ParsedIntent Parse(string rawQuery);
}
