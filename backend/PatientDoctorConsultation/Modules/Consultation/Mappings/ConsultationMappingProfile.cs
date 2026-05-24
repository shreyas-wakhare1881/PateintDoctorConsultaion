using AutoMapper;

namespace PatientDoctorConsultation.Modules.Consultation.Mappings;

/// <summary>
/// Consultation module AutoMapper profile.
/// ConsultationService uses manual LINQ projections for all cross-table joins.
/// This class is kept so AutoMapper assembly scanning includes this assembly without errors.
/// </summary>
public class ConsultationMappingProfile : Profile
{
    public ConsultationMappingProfile()
    {
        // Consultation service uses manual projections for cross-table joins.
        // TODO: Full mapping to be implemented in API phase — fields revised per SDD v1.0
    }
}
