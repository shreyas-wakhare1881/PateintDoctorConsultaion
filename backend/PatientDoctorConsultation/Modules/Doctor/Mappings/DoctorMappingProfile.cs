using AutoMapper;
using PatientDoctorConsultation.Modules.Doctor.DTOs;
using PatientDoctorConsultation.Modules.Doctor.Models;

namespace PatientDoctorConsultation.Modules.Doctor.Mappings;

public class DoctorMappingProfile : Profile
{
    public DoctorMappingProfile()
    {
        CreateMap<Doctor, DoctorProfileDto>()
            .ForMember(dest => dest.Email, opt => opt.Ignore())
            .ForMember(dest => dest.IsAvailable, opt =>
                opt.MapFrom(src => src.AvailabilityStatus == Shared.Enums.DoctorAvailabilityStatus.Available));

        CreateMap<Doctor, DoctorListItemDto>()
            .ForMember(dest => dest.IsAvailable, opt =>
                opt.MapFrom(src => src.AvailabilityStatus == Shared.Enums.DoctorAvailabilityStatus.Available));

        CreateMap<UpdateDoctorProfileRequest, Doctor>()
            .ForAllMembers(opt => opt.Condition((_, _, src) => src is not null));
    }
}
