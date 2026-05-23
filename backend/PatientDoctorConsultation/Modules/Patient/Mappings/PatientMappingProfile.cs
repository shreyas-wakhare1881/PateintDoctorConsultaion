using AutoMapper;
using PatientDoctorConsultation.Modules.Patient.DTOs;
using PatientDoctorConsultation.Modules.Patient.Models;

namespace PatientDoctorConsultation.Modules.Patient.Mappings;

public class PatientMappingProfile : Profile
{
    public PatientMappingProfile()
    {
        CreateMap<Patient, PatientProfileDto>()
            .ForMember(dest => dest.Email, opt => opt.Ignore());

        CreateMap<UpdatePatientProfileRequest, Patient>()
            .ForAllMembers(opt => opt.Condition((_, _, src) => src is not null));
    }
}
