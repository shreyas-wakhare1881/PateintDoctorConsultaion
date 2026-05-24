using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PatientDoctorConsultation.Modules.Doctor.Models;

namespace PatientDoctorConsultation.Modules.Doctor.Persistence.Configurations;

public class DoctorAvailabilityConfiguration : IEntityTypeConfiguration<DoctorAvailability>
{
    public void Configure(EntityTypeBuilder<DoctorAvailability> builder)
    {
        // ── Table ─────────────────────────────────────────────────────────────
        builder.ToTable("DoctorAvailabilities");

        // ── Primary Key ───────────────────────────────────────────────────────
        builder.HasKey(a => a.Id);

        // ── Foreign Key ───────────────────────────────────────────────────────
        // Relationship configured on DoctorConfiguration side (HasMany/WithOne/Cascade).
        builder.Property(a => a.DoctorId)
            .IsRequired();

        // ── Schedule Fields ───────────────────────────────────────────────────
        builder.Property(a => a.DayOfWeek)
            .IsRequired();

        // TimeOnly maps to PostgreSQL time without time zone via Npgsql
        builder.Property(a => a.StartTime)
            .IsRequired()
            .HasColumnType("time without time zone");

        builder.Property(a => a.EndTime)
            .IsRequired()
            .HasColumnType("time without time zone");

        builder.Property(a => a.SlotDurationMinutes)
            .IsRequired();

        // ── Status ────────────────────────────────────────────────────────────
        builder.Property(a => a.IsAvailable)
            .IsRequired();

        // ── Audit ─────────────────────────────────────────────────────────────
        builder.Property(a => a.CreatedAt)
            .IsRequired();

        // ── Indexes ───────────────────────────────────────────────────────────
        builder.HasIndex(a => a.DoctorId)
            .HasDatabaseName("IX_DoctorAvailabilities_DoctorId");

        builder.HasIndex(a => new { a.DoctorId, a.DayOfWeek })
            .HasDatabaseName("IX_DoctorAvailabilities_DayOfWeek");
    }
}
