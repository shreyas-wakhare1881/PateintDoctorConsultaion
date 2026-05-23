using AutoMapper;
using PatientDoctorConsultation.Modules.Admin.Models;

namespace PatientDoctorConsultation.Modules.Admin.Mappings;

public class AdminMappingProfile : Profile
{
    public AdminMappingProfile()
    {
        CreateMap<AdminUser, object>();
    }
}
