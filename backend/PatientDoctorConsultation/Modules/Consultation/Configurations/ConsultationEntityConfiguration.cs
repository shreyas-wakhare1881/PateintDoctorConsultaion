using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ConsultationEntity = PatientDoctorConsultation.Modules.Consultation.Models.Consultation;

namespace PatientDoctorConsultation.Modules.Consultation.Configurations;

public class ConsultationEntityConfiguration : IEntityTypeConfiguration<ConsultationEntity>
{
    public void Configure(EntityTypeBuilder<ConsultationEntity> builder)
    {
        builder.ToTable("Consultations");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Status).HasConversion<string>().IsRequired();
        builder.Property(c => c.ScheduledAt).IsRequired();
        builder.Property(c => c.Symptoms).HasMaxLength(1000);
        builder.Property(c => c.AiSummary).HasMaxLength(10_000);
        builder.Property(c => c.Notes).HasMaxLength(5_000);
        builder.HasIndex(c => c.PatientId);
        builder.HasIndex(c => c.DoctorId);
    }
}
