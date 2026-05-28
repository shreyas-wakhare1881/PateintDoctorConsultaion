using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PatientDoctorConsultation.Modules.Consultation.Models;
using PatientDoctorConsultation.Modules.Prescription.Models;
using ConsultationEntity = PatientDoctorConsultation.Modules.Consultation.Models.Consultation;

namespace PatientDoctorConsultation.Modules.Prescription.Persistence.Configurations;

public class PrescriptionConfiguration : IEntityTypeConfiguration<Models.Prescription>
{
    public void Configure(EntityTypeBuilder<Models.Prescription> builder)
    {
        builder.ToTable("Prescriptions");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.ConsultationId).IsRequired();
        builder.HasOne<ConsultationEntity>()
            .WithMany()
            .HasForeignKey(p => p.ConsultationId)
            .HasConstraintName("FK_Prescriptions_Consultations_ConsultationId")
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => p.ConsultationId)
            .IsUnique()
            .HasDatabaseName("UQ_Prescriptions_ConsultationId");

        builder.Property(p => p.DoctorId).IsRequired();
        builder.Property(p => p.PatientId).IsRequired();
        builder.Property(p => p.Diagnosis).HasMaxLength(1000);
        builder.Property(p => p.GeneralInstructions).HasMaxLength(2000);
        builder.Property(p => p.IssuedAt).IsRequired();

        builder.HasMany(p => p.Items)
            .WithOne(i => i.Prescription)
            .HasForeignKey(i => i.PrescriptionId)
            .HasConstraintName("FK_PrescriptionItems_Prescriptions_PrescriptionId")
            .OnDelete(DeleteBehavior.Cascade);
    }
}
