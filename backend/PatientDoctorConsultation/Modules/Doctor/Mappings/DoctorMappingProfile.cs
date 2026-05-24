using AutoMapper;

namespace PatientDoctorConsultation.Modules.Doctor.Mappings;

/// <summary>
/// Doctor module AutoMapper profile.
/// The DoctorService uses manual LINQ projections for all cross-table joins,
/// so no explicit mappings are needed here. The class is kept so AutoMapper's
/// assembly scanning (AddAutoMapper) includes this assembly without errors.
/// </summary>
public class DoctorMappingProfile : Profile
{
    public DoctorMappingProfile()
    {
        // Doctor service uses manual projections for cross-table joins.
    }
}


