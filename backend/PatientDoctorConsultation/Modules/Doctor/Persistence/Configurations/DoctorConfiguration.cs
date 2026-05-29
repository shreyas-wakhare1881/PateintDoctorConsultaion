using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NpgsqlTypes;
using DoctorEntity = PatientDoctorConsultation.Modules.Doctor.Models.Doctor;

namespace PatientDoctorConsultation.Modules.Doctor.Persistence.Configurations;

public class DoctorConfiguration : IEntityTypeConfiguration<DoctorEntity>
{
    public void Configure(EntityTypeBuilder<DoctorEntity> builder)
    {
        // ── Table ─────────────────────────────────────────────────────────────
        builder.ToTable("Doctors");

        // ── Primary Key ───────────────────────────────────────────────────────
        builder.HasKey(d => d.Id);

        // ── Identity Link ─────────────────────────────────────────────────────
        builder.Property(d => d.UserId)
            .IsRequired();

        builder.HasIndex(d => d.UserId)
            .IsUnique()
            .HasDatabaseName("UQ_Doctors_UserId");

        // ── Professional Profile ──────────────────────────────────────────────
        builder.Property(d => d.Specialization)
            .HasMaxLength(256);

        builder.Property(d => d.Qualification)
            .HasMaxLength(512);

        builder.Property(d => d.ExperienceYears);

        // LicenseNumber: unique only when non-null (partial index)
        builder.Property(d => d.LicenseNumber)
            .HasMaxLength(100);

        builder.HasIndex(d => d.LicenseNumber)
            .IsUnique()
            .HasFilter("\"LicenseNumber\" IS NOT NULL")
            .HasDatabaseName("UQ_Doctors_LicenseNumber");

        builder.Property(d => d.Bio)
            .HasColumnType("text");

        builder.Property(d => d.ProfileImageUrl)
            .HasColumnType("text");

        // ── Consultation Metadata ─────────────────────────────────────────────
        builder.Property(d => d.ConsultationFee)
            .HasPrecision(10, 2);

        // PostgreSQL native text[] array for languages
        builder.Property(d => d.LanguagesSpoken)
            .HasColumnType("text[]");

        // ── Practice Location ─────────────────────────────────────────────────
        builder.Property(d => d.HospitalName)
            .HasMaxLength(256);

        builder.Property(d => d.ClinicAddress)
            .HasMaxLength(512);

        builder.Property(d => d.City)
            .HasMaxLength(100);

        builder.Property(d => d.State)
            .HasMaxLength(100);

        builder.Property(d => d.Country)
            .HasMaxLength(100);
        // ── Normalized / Search-Optimized Columns ─────────────────────────────
        builder.Property(d => d.SpecializationNormalized)
            .HasMaxLength(256);

        builder.Property(d => d.CityNormalized)
            .HasMaxLength(100);
        // ── Approval & Visibility ─────────────────────────────────────────────
        builder.Property(d => d.ApprovalStatus)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(d => d.IsProfileCompleted)
            .IsRequired();

        builder.Property(d => d.IsPubliclyVisible)
            .IsRequired();

        // ── Engagement Metrics ────────────────────────────────────────────────
        builder.Property(d => d.Rating)
            .HasPrecision(3, 2);

        builder.Property(d => d.TotalReviews)
            .IsRequired();

        builder.Property(d => d.TotalConsultations)
            .IsRequired();

        // ── Audit Fields ──────────────────────────────────────────────────────
        builder.Property(d => d.CreatedAt)
            .IsRequired();

        // UpdatedAt, CreatedBy, UpdatedBy — inherited from BaseAuditableEntity; nullable by default

        // ── Indexes ───────────────────────────────────────────────────────────
        builder.HasIndex(d => d.ApprovalStatus)
            .HasDatabaseName("IX_Doctors_ApprovalStatus");

        builder.HasIndex(d => new { d.City, d.Specialization })
            .HasDatabaseName("IX_Doctors_City_Specialization");

        builder.HasIndex(d => d.IsPubliclyVisible)
            .HasDatabaseName("IX_Doctors_IsPubliclyVisible");

        // Primary discovery eligibility: composite index for the exact WHERE clause
        // used by every public-facing doctor query (IsPubliclyVisible=true AND ApprovalStatus=Approved).
        builder.HasIndex(d => new { d.IsPubliclyVisible, d.ApprovalStatus })
            .HasDatabaseName("IX_Doctors_Discovery_Eligibility");

        // Normalized column indexes — enable index-range scans for case-insensitive filtering.
        builder.HasIndex(d => d.SpecializationNormalized)
            .HasDatabaseName("IX_Doctors_SpecializationNormalized");

        builder.HasIndex(d => d.CityNormalized)
            .HasDatabaseName("IX_Doctors_CityNormalized");

        // Composite normalized discovery index: covers specialization + city + eligibility.
        builder.HasIndex(d => new { d.IsPubliclyVisible, d.ApprovalStatus, d.SpecializationNormalized, d.CityNormalized })
            .HasDatabaseName("IX_Doctors_Discovery_Composite");

        // Experience range queries for discovery filters.
        builder.HasIndex(d => d.ExperienceYears)
            .HasDatabaseName("IX_Doctors_ExperienceYears");

        // Fee range queries for discovery filters.
        builder.HasIndex(d => d.ConsultationFee)
            .HasDatabaseName("IX_Doctors_ConsultationFee");

        // ── Full-Text Search Vector ───────────────────────────────────────────
        // SearchVector is maintained by a DB trigger (see migration AddSprint3SearchIntelligence).
        // EF is told the column is stored (computed) so it never tries to write it.
        builder.Property(d => d.SearchVector)
            .HasColumnName("SearchVector")
            .HasColumnType("tsvector");

        // GIN index for fast FTS queries.
        builder.HasIndex(d => d.SearchVector)
            .HasDatabaseName("IX_Doctors_SearchVector")
            .HasMethod("GIN");

        // ── Soft Delete Global Query Filter ───────────────────────────────────
        // All queries automatically exclude soft-deleted doctors.
        builder.HasQueryFilter(d => d.DeletedAt == null);

        // ── Relationships ─────────────────────────────────────────────────────
        // One Doctor → Many DoctorAvailabilities (cascade delete)
        builder.HasMany(d => d.Availabilities)
            .WithOne(a => a.Doctor)
            .HasForeignKey(a => a.DoctorId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
