using AutoMapper;
using PatientDoctorConsultation.Modules.Consultation.DTOs;
using ConsultationEntity = PatientDoctorConsultation.Modules.Consultation.Models.Consultation;

namespace PatientDoctorConsultation.Modules.Consultation.Mappings;

public class ConsultationMappingProfile : Profile
{
    public ConsultationMappingProfile()
    {
        CreateMap<ConsultationEntity, ConsultationDto>()
            .ForMember(dest => dest.PatientName, opt => opt.Ignore())
            .ForMember(dest => dest.DoctorName, opt => opt.Ignore())
            .ForMember(dest => dest.DoctorSpecialization, opt => opt.Ignore());

        CreateMap<BookConsultationRequest, ConsultationEntity>()
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.RoomId, opt => opt.Ignore());
    }
}
