using AutoMapper;
using PatientDoctorConsultation.Modules.Auth.DTOs;
using PatientDoctorConsultation.Modules.Auth.Models;

namespace PatientDoctorConsultation.Modules.Auth.Mappings;

public class AuthMappingProfile : Profile
{
    public AuthMappingProfile()
    {
        CreateMap<User, UserProfileDto>()
            .ForCtorParam("phoneNumber", opt => opt.MapFrom(
                src => string.IsNullOrEmpty(src.PhoneNumber) ? null : src.PhoneNumber))
            .ForCtorParam("role", opt => opt.MapFrom(src => src.Role.ToString()));
    }
}
