using AutoMapper;
using PatientDoctorConsultation.Modules.Doctor.DTOs;
using PatientDoctorConsultation.Shared.Enums;
using DoctorModel = PatientDoctorConsultation.Modules.Doctor.Models.Doctor;

namespace PatientDoctorConsultation.Modules.Doctor.Mappings;

public class DoctorMappingProfile : Profile
{
    public DoctorMappingProfile()
    {
        CreateMap<DoctorModel, DoctorProfileDto>()
            .ForMember(dest => dest.Email, opt => opt.Ignore())
            .ForMember(dest => dest.IsAvailable, opt =>
                opt.MapFrom(src => src.AvailabilityStatus == DoctorAvailabilityStatus.Available));

        CreateMap<DoctorModel, DoctorListItemDto>()
            .ForMember(dest => dest.IsAvailable, opt =>
                opt.MapFrom(src => src.AvailabilityStatus == DoctorAvailabilityStatus.Available));

        CreateMap<UpdateDoctorProfileRequest, DoctorModel>()
            .ForAllMembers(opt => opt.Condition((_, _, src) => src is not null));
    }
}
