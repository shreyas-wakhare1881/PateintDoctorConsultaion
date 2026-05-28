using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PatientDoctorConsultation.Modules.Prescription.Models;

namespace PatientDoctorConsultation.Modules.Prescription.Persistence.Configurations;

public class PrescriptionItemConfiguration : IEntityTypeConfiguration<PrescriptionItem>
{
    public void Configure(EntityTypeBuilder<PrescriptionItem> builder)
    {
        builder.ToTable("PrescriptionItems");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.PrescriptionId).IsRequired();
        builder.Property(i => i.MedicineName).IsRequired().HasMaxLength(200);
        builder.Property(i => i.Dosage).IsRequired().HasMaxLength(100);
        builder.Property(i => i.Frequency).IsRequired().HasMaxLength(100);
        builder.Property(i => i.Duration).IsRequired().HasMaxLength(100);
        builder.Property(i => i.Instructions).HasMaxLength(500);
    }
}
