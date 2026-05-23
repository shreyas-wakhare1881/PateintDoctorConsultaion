using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PatientDoctorConsultation.Modules.Consultation.Models;

namespace PatientDoctorConsultation.Infrastructure.Persistence.Configurations;

public class ConsultationEntityConfiguration : IEntityTypeConfiguration<Consultation>
{
    public void Configure(EntityTypeBuilder<Consultation> builder)
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
