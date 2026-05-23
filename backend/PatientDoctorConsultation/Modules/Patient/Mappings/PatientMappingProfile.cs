using AutoMapper;
using PatientDoctorConsultation.Modules.Patient.DTOs;
using PatientModel = PatientDoctorConsultation.Modules.Patient.Models.Patient;

namespace PatientDoctorConsultation.Modules.Patient.Mappings;

public class PatientMappingProfile : Profile
{
    public PatientMappingProfile()
    {
        CreateMap<PatientModel, PatientProfileDto>()
            .ForMember(dest => dest.Email, opt => opt.Ignore());

        CreateMap<UpdatePatientProfileRequest, PatientModel>()
            .ForAllMembers(opt => opt.Condition((_, _, src) => src is not null));
    }
}
