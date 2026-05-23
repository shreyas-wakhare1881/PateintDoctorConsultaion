using AutoMapper;
using PatientDoctorConsultation.Modules.Consultation.DTOs;
using PatientDoctorConsultation.Modules.Consultation.Models;

namespace PatientDoctorConsultation.Modules.Consultation.Mappings;

public class ConsultationMappingProfile : Profile
{
    public ConsultationMappingProfile()
    {
        CreateMap<Consultation, ConsultationDto>()
            .ForMember(dest => dest.PatientName, opt => opt.Ignore())
            .ForMember(dest => dest.DoctorName, opt => opt.Ignore())
            .ForMember(dest => dest.DoctorSpecialization, opt => opt.Ignore());

        CreateMap<BookConsultationRequest, Consultation>()
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.RoomId, opt => opt.Ignore());
    }
}
