namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP;

/// <summary>
/// Normalizes raw patient query text before NLP processing.
///
/// Responsibilities:
///   — Lowercase normalization for case-insensitive deterministic matching.
///   — Whitespace cleanup (multiple spaces → single space, trim).
///   — Special character removal (!, ?, ., etc.) that add no semantic value.
///   — Hyphen-to-space conversion ("skin-doctor" → "skin doctor").
///
/// Registered as Singleton — fully stateless, thread-safe.
/// </summary>
public interface IQueryNormalizer
{
    /// <summary>
    /// Produces a clean, normalized version of the raw input query.
    ///
    /// Guarantees:
    ///   — Result is lowercase.
    ///   — All whitespace sequences are collapsed to a single space.
    ///   — Only alphanumeric characters and spaces remain.
    ///   — Leading/trailing whitespace is removed.
    ///
    /// Returns <see cref="string.Empty"/> if <paramref name="rawQuery"/>
    /// is null, empty, or whitespace-only.
    /// </summary>
    string Normalize(string rawQuery);
}
