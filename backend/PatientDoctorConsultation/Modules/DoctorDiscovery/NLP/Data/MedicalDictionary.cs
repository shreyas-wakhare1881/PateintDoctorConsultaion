namespace PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Data;

/// <summary>
/// Single source of truth for all medical vocabulary used by the NLP pipeline.
///
/// Design principles:
///   — Dictionary-driven: all data lives here, not scattered in services.
///   — Expandable: add a row to extend vocabulary with zero code changes elsewhere.
///   — Case-insensitive lookups are handled by callers; keys stored in original casing.
///   — Future AI Search can use this as a seed vocabulary.
/// </summary>
public static class MedicalDictionary
{
    // ════════════════════════════════════════════════════════════════════
    // CANONICAL SPECIALIZATION NAMES
    // These are the values stored in Doctor.Specialization in the DB.
    // The synonym map ALWAYS resolves to one of these names.
    // ════════════════════════════════════════════════════════════════════
    public static readonly IReadOnlyList<string> KnownSpecializations =
    [
        // Core specialties present in DB seed data
        "Cardiology",
        "Dermatology",
        "ENT",
        "General Medicine",
        "Gynecology",
        "Neurology",
        "Ophthalmology",
        "Orthopedics",
        "Pediatrics",
        "Psychiatry",
        // Extended specialties (for future doctor registrations)
        "Dentistry",
        "Diabetology",
        "Endocrinology",
        "Gastroenterology",
        "General Surgery",
        "Hematology",
        "Internal Medicine",
        "Nephrology",
        "Oncology",
        "Pulmonology",
        "Radiology",
        "Rheumatology",
        "Urology",
        "Anesthesiology",
        "Cardiothoracic Surgery",
        "Neurosurgery",
        "Plastic Surgery",
        "Vascular Surgery",
    ];

    // ════════════════════════════════════════════════════════════════════
    // SYNONYM → CANONICAL SPECIALIZATION MAP
    //
    // Keys: patient-language phrases (lay terms, common misspellings,
    //       alternate spellings including British English).
    // Values: canonical specialization name from KnownSpecializations.
    //
    // SORTED by key length descending at build time so multi-word phrases
    // are matched before single-word subsets.
    // ════════════════════════════════════════════════════════════════════
    private static readonly Dictionary<string, string> _rawSynonyms =
        new(StringComparer.OrdinalIgnoreCase)
        {
            // ── Cardiology ────────────────────────────────────────────
            ["heart doctor"]          = "Cardiology",
            ["heart specialist"]      = "Cardiology",
            ["heart physician"]       = "Cardiology",
            ["cardiac doctor"]        = "Cardiology",
            ["cardiac specialist"]    = "Cardiology",
            ["cardio doctor"]         = "Cardiology",
            ["cardio specialist"]     = "Cardiology",
            ["cardiologist"]          = "Cardiology",
            ["cardiologists"]         = "Cardiology",
            ["cardiology"]            = "Cardiology",
            ["cardio"]                = "Cardiology",   // stem/prefix search

            // ── Dermatology ───────────────────────────────────────────
            ["skin doctor"]           = "Dermatology",
            ["skin specialist"]       = "Dermatology",
            ["skin physician"]        = "Dermatology",
            ["skin expert"]           = "Dermatology",
            ["dermatologist"]         = "Dermatology",
            ["dermatologists"]        = "Dermatology",
            ["dermatology"]           = "Dermatology",
            ["derma"]                 = "Dermatology",  // stem/prefix search

            // ── Neurology ─────────────────────────────────────────────
            ["brain doctor"]          = "Neurology",
            ["brain specialist"]      = "Neurology",
            ["brain physician"]       = "Neurology",
            ["nerve specialist"]      = "Neurology",
            ["nerve doctor"]          = "Neurology",
            ["neurologist"]           = "Neurology",
            ["neurology"]             = "Neurology",

            // ── Ophthalmology ─────────────────────────────────────────
            ["eye doctor"]            = "Ophthalmology",
            ["eye specialist"]        = "Ophthalmology",
            ["eye physician"]         = "Ophthalmology",
            ["eye surgeon"]           = "Ophthalmology",
            ["ophthalmologist"]       = "Ophthalmology",
            ["ophthalmology"]         = "Ophthalmology",

            // ── Orthopedics ───────────────────────────────────────────
            ["bone doctor"]           = "Orthopedics",
            ["bone specialist"]       = "Orthopedics",
            ["joint doctor"]          = "Orthopedics",
            ["joint specialist"]      = "Orthopedics",
            ["joint pain doctor"]     = "Orthopedics",
            ["knee doctor"]           = "Orthopedics",
            ["back pain doctor"]      = "Orthopedics",
            ["orthopedic"]            = "Orthopedics",
            ["orthopaedic"]           = "Orthopedics",
            ["orthopedics"]           = "Orthopedics",
            ["orthopaedics"]          = "Orthopedics",

            // ── Pediatrics ────────────────────────────────────────────
            ["child doctor"]          = "Pediatrics",
            ["children doctor"]       = "Pediatrics",
            ["children specialist"]   = "Pediatrics",
            ["child specialist"]      = "Pediatrics",
            ["kid doctor"]            = "Pediatrics",
            ["kids doctor"]           = "Pediatrics",
            ["baby doctor"]           = "Pediatrics",
            ["infant doctor"]         = "Pediatrics",
            ["pediatrician"]          = "Pediatrics",
            ["paediatrician"]         = "Pediatrics",
            ["pediatrics"]            = "Pediatrics",
            ["paediatrics"]           = "Pediatrics",

            // ── ENT ───────────────────────────────────────────────────
            ["ear nose throat"]       = "ENT",
            ["ear throat doctor"]     = "ENT",
            ["ent specialist"]        = "ENT",
            ["ent doctor"]            = "ENT",
            ["ear specialist"]        = "ENT",
            ["throat specialist"]     = "ENT",
            ["nose specialist"]       = "ENT",

            // ── Psychiatry ────────────────────────────────────────────
            ["mental doctor"]         = "Psychiatry",
            ["mind doctor"]           = "Psychiatry",
            ["mental health doctor"]  = "Psychiatry",
            ["mental specialist"]     = "Psychiatry",
            ["depression doctor"]     = "Psychiatry",
            ["anxiety doctor"]        = "Psychiatry",
            ["psychiatrist"]          = "Psychiatry",
            ["psychiatry"]            = "Psychiatry",

            // ── Gynecology ────────────────────────────────────────────
            ["women specialist"]      = "Gynecology",
            ["women doctor"]          = "Gynecology",
            ["pregnancy doctor"]      = "Gynecology",
            ["gynecologist"]          = "Gynecology",
            ["gynaecologist"]         = "Gynecology",
            ["gynecology"]            = "Gynecology",
            ["gynaecology"]           = "Gynecology",
            ["obs doctor"]            = "Gynecology",
            ["obstetrician"]          = "Gynecology",

            // ── General Practice ──────────────────────────────────────
            ["general doctor"]        = "General Medicine",
            ["general physician"]     = "General Medicine",
            ["family doctor"]         = "General Medicine",
            ["family physician"]      = "General Medicine",
            ["primary care doctor"]   = "General Medicine",

            // ── Dentistry ─────────────────────────────────────────────
            ["tooth doctor"]          = "Dentistry",
            ["teeth doctor"]          = "Dentistry",
            ["dental doctor"]         = "Dentistry",
            ["dental specialist"]     = "Dentistry",
            ["dentist"]               = "Dentistry",
            ["dentists"]              = "Dentistry",
            ["dental"]                = "Dentistry",

            // ── Diabetology ───────────────────────────────────────────
            ["diabetes doctor"]       = "Diabetology",
            ["sugar doctor"]          = "Diabetology",
            ["diabetes specialist"]   = "Diabetology",
            ["sugar specialist"]      = "Diabetology",
            ["diabetologist"]         = "Diabetology",

            // ── Gastroenterology ──────────────────────────────────────
            ["stomach doctor"]        = "Gastroenterology",
            ["liver doctor"]          = "Gastroenterology",
            ["gut specialist"]        = "Gastroenterology",
            ["stomach specialist"]    = "Gastroenterology",
            ["digestive doctor"]      = "Gastroenterology",
            ["gastroenterologist"]    = "Gastroenterology",
            ["gastroenterology"]      = "Gastroenterology",

            // ── Nephrology ────────────────────────────────────────────
            ["kidney doctor"]         = "Nephrology",
            ["kidney specialist"]     = "Nephrology",
            ["nephrologist"]          = "Nephrology",
            ["nephrology"]            = "Nephrology",

            // ── Pulmonology ───────────────────────────────────────────
            ["lung doctor"]           = "Pulmonology",
            ["chest doctor"]          = "Pulmonology",
            ["breathing specialist"]  = "Pulmonology",
            ["respiratory doctor"]    = "Pulmonology",
            ["pulmonologist"]         = "Pulmonology",
            ["pulmonology"]           = "Pulmonology",

            // ── Oncology ─────────────────────────────────────────────
            ["cancer doctor"]         = "Oncology",
            ["cancer specialist"]     = "Oncology",
            ["tumor doctor"]          = "Oncology",
            ["oncologist"]            = "Oncology",
            ["oncology"]              = "Oncology",

            // ── Urology ───────────────────────────────────────────────
            ["kidney stone doctor"]   = "Urology",
            ["urologist"]             = "Urology",
            ["urology"]               = "Urology",

            // ── Endocrinology ─────────────────────────────────────────
            ["hormone doctor"]        = "Endocrinology",
            ["thyroid doctor"]        = "Endocrinology",
            ["thyroid specialist"]    = "Endocrinology",
            ["endocrinologist"]       = "Endocrinology",

            // ── Plural specialist forms ───────────────────────────────
            // Handles queries like "find cardiologists" or "list dermatologists"
            ["cardiologists"]         = "Cardiology",
            ["dermatologists"]        = "Dermatology",
            ["neurologists"]          = "Neurology",
            ["ophthalmologists"]      = "Ophthalmology",
            ["orthopedicians"]        = "Orthopedics",
            ["orthopedists"]          = "Orthopedics",
            ["pediatricians"]         = "Pediatrics",
            ["paediatricians"]        = "Pediatrics",
            ["psychiatrists"]         = "Psychiatry",
            ["gynecologists"]         = "Gynecology",
            ["gynaecologists"]        = "Gynecology",
            ["gastroenterologists"]   = "Gastroenterology",
            ["nephrologists"]         = "Nephrology",
            ["pulmonologists"]        = "Pulmonology",
            ["oncologists"]           = "Oncology",
            ["urologists"]            = "Urology",
            ["endocrinologists"]      = "Endocrinology",
            ["diabetologists"]        = "Diabetology",
        };

    /// <summary>
    /// Synonym entries sorted by key length descending.
    /// Ensures multi-word phrases like "heart doctor" are matched before "heart" alone.
    /// </summary>
    public static readonly IReadOnlyList<KeyValuePair<string, string>> SynonymsSortedByLengthDesc =
        [.. _rawSynonyms.OrderByDescending(kv => kv.Key.Length)];

    /// <summary>
    /// Direct lookup: synonym → canonical specialization.
    /// </summary>
    public static readonly IReadOnlyDictionary<string, string> SynonymToSpecialization = _rawSynonyms;

    // ════════════════════════════════════════════════════════════════════
    // SYMPTOM / DISEASE → CANONICAL SPECIALIZATION MAP
    //
    // Keys: patient-language symptom descriptions and disease names.
    // Values: canonical specialization (same as KnownSpecializations).
    //
    // SEPARATE from SynonymToSpecialization to enable confidence differentiation:
    //   — Direct synonym match  → HIGH confidence   (user asked for doctor type)
    //   — Symptom/disease match → MEDIUM confidence (system inferred from symptoms)
    //
    // Sorted by key length descending so "shortness of breath" (19 chars)
    // is checked before "breath" (6 chars) — longest phrase wins.
    // ════════════════════════════════════════════════════════════════════
    private static readonly Dictionary<string, string> _symptomMap =
        new(StringComparer.OrdinalIgnoreCase)
        {
            // ── Cardiology ────────────────────────────────────────────
            ["irregular heartbeat"]   = "Cardiology",
            ["chest discomfort"]      = "Cardiology",
            ["heart attack"]          = "Cardiology",
            ["palpitations"]          = "Cardiology",
            ["chest pain"]            = "Cardiology",
            ["heart pain"]            = "Cardiology",

            // ── Dermatology ───────────────────────────────────────────
            ["skin problem"]          = "Dermatology",
            ["skin problems"]         = "Dermatology",
            ["skin allergy"]          = "Dermatology",
            ["skin issue"]            = "Dermatology",
            ["skin issues"]           = "Dermatology",
            ["skin rashes"]           = "Dermatology",
            ["skin rash"]             = "Dermatology",
            ["psoriasis"]             = "Dermatology",
            ["eczema"]                = "Dermatology",
            ["acne"]                  = "Dermatology",

            // ── Neurology ─────────────────────────────────────────────
            ["severe headache"]       = "Neurology",
            ["memory loss"]           = "Neurology",
            ["brain fog"]             = "Neurology",
            ["migraines"]             = "Neurology",
            ["migraine"]              = "Neurology",
            ["headache"]              = "Neurology",
            ["seizures"]              = "Neurology",
            ["seizure"]               = "Neurology",
            ["epilepsy"]              = "Neurology",
            ["paralysis"]             = "Neurology",

            // ── Psychiatry ────────────────────────────────────────────
            ["stress disorder"]       = "Psychiatry",
            ["panic attacks"]         = "Psychiatry",
            ["mental health"]         = "Psychiatry",
            ["panic attack"]          = "Psychiatry",
            ["depression"]            = "Psychiatry",
            ["insomnia"]              = "Psychiatry",
            ["anxiety"]               = "Psychiatry",
            ["phobia"]                = "Psychiatry",
            ["ocd"]                   = "Psychiatry",

            // ── Pediatrics ────────────────────────────────────────────
            ["child with fever"]      = "Pediatrics",
            ["child has fever"]       = "Pediatrics",
            ["child illness"]         = "Pediatrics",
            ["infant fever"]          = "Pediatrics",
            ["child fever"]           = "Pediatrics",
            ["baby fever"]            = "Pediatrics",

            // ── Gastroenterology ──────────────────────────────────────
            ["digestive problem"]     = "Gastroenterology",
            ["abdominal pain"]        = "Gastroenterology",
            ["stomach pain"]          = "Gastroenterology",
            ["acid reflux"]           = "Gastroenterology",
            ["ibs"]                   = "Gastroenterology",

            // ── Orthopedics ───────────────────────────────────────────
            ["spine problem"]         = "Orthopedics",
            ["joint pain"]            = "Orthopedics",
            ["back pain"]             = "Orthopedics",
            ["knee pain"]             = "Orthopedics",
            ["bone pain"]             = "Orthopedics",
            ["hip pain"]              = "Orthopedics",

            // ── Pulmonology ───────────────────────────────────────────
            ["shortness of breath"]   = "Pulmonology",
            ["breathing difficulty"]  = "Pulmonology",
            ["breathing problem"]     = "Pulmonology",
            ["chronic cough"]         = "Pulmonology",
            ["asthma"]                = "Pulmonology",

            // ── Ophthalmology ─────────────────────────────────────────
            ["vision problem"]        = "Ophthalmology",
            ["blurred vision"]        = "Ophthalmology",
            ["eye problem"]           = "Ophthalmology",
            ["eye pain"]              = "Ophthalmology",

            // ── Nephrology ────────────────────────────────────────────
            ["kidney infection"]      = "Nephrology",
            ["kidney pain"]           = "Nephrology",

            // ── Urology ───────────────────────────────────────────────
            ["kidney stones"]         = "Urology",
            ["kidney stone"]          = "Urology",

            // ── Endocrinology ─────────────────────────────────────────
            ["hormone imbalance"]     = "Endocrinology",
            ["thyroid problem"]       = "Endocrinology",
            ["thyroid issues"]        = "Endocrinology",

            // ── Diabetology ───────────────────────────────────────────
            ["diabetes"]              = "Diabetology",

            // ── Dentistry ─────────────────────────────────────────────
            ["tooth pain"]            = "Dentistry",
            ["toothache"]             = "Dentistry",
            ["tooth ache"]            = "Dentistry",
            ["dental pain"]           = "Dentistry",
            ["gum pain"]              = "Dentistry",
            ["bleeding gums"]         = "Dentistry",

            // ── General Medicine (fallback) ────────────────────────────
            ["general checkup"]       = "General Medicine",
            ["health checkup"]        = "General Medicine",
            ["cold and fever"]        = "General Medicine",
            ["body ache"]             = "General Medicine",
            ["fever"]                 = "General Medicine",
        };

    /// <summary>
    /// Symptom/disease entries sorted by key length descending.
    /// Used by <see cref="MedicalSynonymService"/> as a fallback after direct synonyms.
    /// Longer phrases (e.g., "shortness of breath") are tried before shorter ones.
    /// </summary>
    public static readonly IReadOnlyList<KeyValuePair<string, string>> SymptomsSortedByLengthDesc =
        [.. _symptomMap.OrderByDescending(kv => kv.Key.Length)];

    /// <summary>
    /// Direct lookup: symptom/disease key → canonical specialization.
    /// </summary>
    public static readonly IReadOnlyDictionary<string, string> SymptomToSpecialization = _symptomMap;

    /// <summary>
    /// Fast set of all symptom keys for confidence differentiation.
    /// If the matched synonym key is in this set, confidence is reduced (symptom-inferred).
    /// </summary>
    public static readonly IReadOnlySet<string> SymptomKeys =
        new HashSet<string>(_symptomMap.Keys, StringComparer.OrdinalIgnoreCase);

    // ════════════════════════════════════════════════════════════════════
    // KNOWN LANGUAGES
    // Used by the intent parser to detect language preferences in queries.
    // ════════════════════════════════════════════════════════════════════
    public static readonly IReadOnlySet<string> KnownLanguages =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Hindi", "English", "Marathi", "Gujarati", "Bengali", "Tamil",
            "Telugu", "Kannada", "Malayalam", "Punjabi", "Odia", "Urdu",
            "Assamese", "Konkani", "Kashmiri", "Sanskrit", "Bhojpuri",
        };

    // ════════════════════════════════════════════════════════════════════
    // CITY ALIAS → CANONICAL FORM
    //
    // Key: lowercase alias (used for case-insensitive matching in queries).
    // Value: canonical city name (properly cased; must match DB values).
    //
    // Covers: modern names, colonial names, common abbreviations.
    // ════════════════════════════════════════════════════════════════════
    public static readonly IReadOnlyDictionary<string, string> CityAliasToCanonical =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            // Metro cities
            ["mumbai"]          = "Mumbai",
            ["bombay"]          = "Mumbai",
            ["delhi"]           = "Delhi",
            ["new delhi"]       = "Delhi",
            ["bangalore"]       = "Bangalore",
            ["bengaluru"]       = "Bangalore",
            ["bengalore"]       = "Bangalore",
            ["hyderabad"]       = "Hyderabad",
            ["secunderabad"]    = "Hyderabad",
            ["chennai"]         = "Chennai",
            ["madras"]          = "Chennai",
            ["kolkata"]         = "Kolkata",
            ["calcutta"]        = "Kolkata",

            // Tier-1 cities
            ["pune"]            = "Pune",
            ["poona"]           = "Pune",
            ["ahmedabad"]       = "Ahmedabad",
            ["amdavad"]         = "Ahmedabad",
            ["jaipur"]          = "Jaipur",
            ["surat"]           = "Surat",
            ["lucknow"]         = "Lucknow",
            ["kanpur"]          = "Kanpur",
            ["nagpur"]          = "Nagpur",
            ["indore"]          = "Indore",
            ["thane"]           = "Thane",
            ["bhopal"]          = "Bhopal",
            ["visakhapatnam"]   = "Visakhapatnam",
            ["vizag"]           = "Visakhapatnam",
            ["patna"]           = "Patna",
            ["vadodara"]        = "Vadodara",
            ["baroda"]          = "Vadodara",

            // Tier-2 cities
            ["ghaziabad"]       = "Ghaziabad",
            ["ludhiana"]        = "Ludhiana",
            ["agra"]            = "Agra",
            ["nashik"]          = "Nashik",
            ["nasik"]           = "Nashik",
            ["faridabad"]       = "Faridabad",
            ["meerut"]          = "Meerut",
            ["rajkot"]          = "Rajkot",
            ["varanasi"]        = "Varanasi",
            ["banaras"]         = "Varanasi",
            ["kashi"]           = "Varanasi",
            ["srinagar"]        = "Srinagar",
            ["amritsar"]        = "Amritsar",
            ["allahabad"]       = "Allahabad",
            ["prayagraj"]       = "Allahabad",
            ["vijayawada"]      = "Vijayawada",
            ["aurangabad"]      = "Aurangabad",
            ["dhanbad"]         = "Dhanbad",
            ["chandigarh"]      = "Chandigarh",
            ["coimbatore"]      = "Coimbatore",
            ["ranchi"]          = "Ranchi",
            ["jabalpur"]        = "Jabalpur",
            ["gwalior"]         = "Gwalior",
            ["raipur"]          = "Raipur",
            ["kota"]            = "Kota",
            ["guwahati"]        = "Guwahati",
            ["trivandrum"]      = "Thiruvananthapuram",
            ["thiruvananthapuram"] = "Thiruvananthapuram",
            ["jodhpur"]         = "Jodhpur",
            ["madurai"]         = "Madurai",
            ["mysore"]          = "Mysore",
            ["mysuru"]          = "Mysore",
            ["mangalore"]       = "Mangalore",
            ["mangaluru"]       = "Mangalore",
            ["kochi"]           = "Kochi",
            ["cochin"]          = "Kochi",
            ["ernakulam"]       = "Kochi",
            ["navi mumbai"]     = "Navi Mumbai",
            ["noida"]           = "Noida",
            ["gurugram"]        = "Gurugram",
            ["gurgaon"]         = "Gurugram",
            ["kalyan"]          = "Kalyan",
            ["bhubaneswar"]     = "Bhubaneswar",
            ["hubli"]           = "Hubli",
            ["dharwad"]         = "Hubli",
            ["dehradun"]        = "Dehradun",
            ["bikaner"]         = "Bikaner",
            ["noida"]           = "Noida",
            ["tirupati"]        = "Tirupati",
            ["salem"]           = "Salem",
            ["aligarh"]         = "Aligarh",
            ["kolhapur"]        = "Kolhapur",
            ["solapur"]         = "Solapur",
            ["jammu"]           = "Jammu",
        };
}
