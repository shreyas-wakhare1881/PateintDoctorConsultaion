using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PatientDoctorConsultation.Modules.Consultation.Models;

namespace PatientDoctorConsultation.Modules.Consultation.Persistence.Configurations;

public class ConsultationStatusHistoryConfiguration : IEntityTypeConfiguration<ConsultationStatusHistory>
{
    public void Configure(EntityTypeBuilder<ConsultationStatusHistory> builder)
    {
        // ── Table ─────────────────────────────────────────────────────────────
        builder.ToTable("ConsultationStatusHistories");

        // ── Primary Key ───────────────────────────────────────────────────────
        builder.HasKey(h => h.Id);

        // ── ConsultationId FK — relationship configured on ConsultationConfiguration ──
        builder.Property(h => h.ConsultationId)
            .IsRequired();

        // ── Status Transition Fields ──────────────────────────────────────────
        // OldStatus is nullable — NULL on initial booking creation event
        builder.Property(h => h.OldStatus)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(h => h.NewStatus)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        // ── Audit Fields ──────────────────────────────────────────────────────
        /// <summary>FK → Users.Id. Cross-module — no navigation property (modular boundary).</summary>
        builder.Property(h => h.ChangedByUserId)
            .IsRequired();

        builder.Property(h => h.Reason)
            .HasColumnType("text");

        builder.Property(h => h.CreatedAt)
            .IsRequired();

        // ── Indexes ───────────────────────────────────────────────────────────
        builder.HasIndex(h => h.ConsultationId)
            .HasDatabaseName("IX_ConsultationStatusHistories_ConsultationId");
    }
}
