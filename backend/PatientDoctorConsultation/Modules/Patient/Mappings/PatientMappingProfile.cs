using AutoMapper;

namespace PatientDoctorConsultation.Modules.Patient.Mappings;

/// <summary>
/// Patient module AutoMapper profile.
/// PatientService uses manual LINQ projections for all cross-table joins.
/// This class is kept so AutoMapper assembly scanning includes this assembly without errors.
/// </summary>
public class PatientMappingProfile : Profile
{
    public PatientMappingProfile()
    {
        // Patient service uses manual projections for cross-table joins.
    }
}
