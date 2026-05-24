using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PatientEntity = PatientDoctorConsultation.Modules.Patient.Models.Patient;

namespace PatientDoctorConsultation.Modules.Patient.Persistence.Configurations;

public class PatientConfiguration : IEntityTypeConfiguration<PatientEntity>
{
    public void Configure(EntityTypeBuilder<PatientEntity> builder)
    {
        // ── Table ─────────────────────────────────────────────────────────────
        builder.ToTable("Patients");

        // ── Primary Key ───────────────────────────────────────────────────────
        builder.HasKey(p => p.Id);

        // ── Identity Link ─────────────────────────────────────────────────────
        builder.Property(p => p.UserId)
            .IsRequired();

        // One patient profile per user account — enforced at database level
        builder.HasIndex(p => p.UserId)
            .IsUnique()
            .HasDatabaseName("UQ_Patients_UserId");

        // ── Basic Health Fields ───────────────────────────────────────────────
        builder.Property(p => p.Gender)
            .HasMaxLength(20);

        // DateOnly maps to PostgreSQL 'date' column (no time component)
        builder.Property(p => p.DateOfBirth)
            .HasColumnType("date");

        builder.Property(p => p.BloodGroup)
            .HasMaxLength(10);

        // ── Physical Metrics ──────────────────────────────────────────────────
        // HeightCm: integer — no special mapping required

        // WeightKg: precision(5,2) supports values up to 999.99 kg
        builder.Property(p => p.WeightKg)
            .HasPrecision(5, 2);

        // ── Medical Information ───────────────────────────────────────────────
        // Free-text fields — stored as unbounded 'text' column
        builder.Property(p => p.Allergies)
            .HasColumnType("text");

        builder.Property(p => p.ChronicDiseases)
            .HasColumnType("text");

        // ── Emergency Contact ─────────────────────────────────────────────────
        builder.Property(p => p.EmergencyContactName)
            .HasMaxLength(150);

        builder.Property(p => p.EmergencyContactPhone)
            .HasMaxLength(20);

        // ── Location ──────────────────────────────────────────────────────────
        builder.Property(p => p.Address)
            .HasMaxLength(512);

        builder.Property(p => p.City)
            .HasMaxLength(100);

        builder.Property(p => p.State)
            .HasMaxLength(100);

        builder.Property(p => p.Country)
            .HasMaxLength(100);

        // ── Profile Metadata ──────────────────────────────────────────────────
        builder.Property(p => p.ProfileImageUrl)
            .HasColumnType("text");

        builder.Property(p => p.IsProfileCompleted)
            .IsRequired()
            .HasDefaultValue(false);

        // ── Audit Fields (from BaseAuditableEntity) ───────────────────────────
        builder.Property(p => p.CreatedAt)
            .IsRequired();

        // UpdatedAt, CreatedBy, UpdatedBy — inherited; nullable by default

        // ── Soft Delete ───────────────────────────────────────────────────────
        // DeletedAt is nullable — NULL means active record
        // No additional column config needed beyond what EF infers

        // ── Indexes ───────────────────────────────────────────────────────────
        // Supports the global query filter scan performance
        builder.HasIndex(p => p.DeletedAt)
            .HasDatabaseName("IX_Patients_DeletedAt");

        // ── Soft Delete Global Query Filter ───────────────────────────────────
        // All queries automatically exclude soft-deleted patients.
        // Mirrors the same pattern used in DoctorConfiguration.
        builder.HasQueryFilter(p => p.DeletedAt == null);
    }
}
