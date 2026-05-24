using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PatientDoctorConsultation.Modules.Consultation.Models;
using DoctorAvailabilityEntity = PatientDoctorConsultation.Modules.Doctor.Models.DoctorAvailability;
using DoctorEntity = PatientDoctorConsultation.Modules.Doctor.Models.Doctor;
using PatientEntity = PatientDoctorConsultation.Modules.Patient.Models.Patient;
using ConsultationEntity = PatientDoctorConsultation.Modules.Consultation.Models.Consultation;

namespace PatientDoctorConsultation.Modules.Consultation.Persistence.Configurations;

public class ConsultationConfiguration : IEntityTypeConfiguration<ConsultationEntity>
{
    public void Configure(EntityTypeBuilder<ConsultationEntity> builder)
    {
        // ── Table ─────────────────────────────────────────────────────────────
        builder.ToTable("Consultations");

        // ── Primary Key ───────────────────────────────────────────────────────
        builder.HasKey(c => c.Id);

        // ── Cross-Module FK: PatientId → Patients.Id (RESTRICT) ──────────────
        builder.Property(c => c.PatientId)
            .IsRequired();

        builder.HasOne<PatientEntity>()
            .WithMany()
            .HasForeignKey(c => c.PatientId)
            .HasConstraintName("FK_Consultations_Patients_PatientId")
            .OnDelete(DeleteBehavior.Restrict);

        // ── Cross-Module FK: DoctorId → Doctors.Id (RESTRICT) ────────────────
        builder.Property(c => c.DoctorId)
            .IsRequired();

        builder.HasOne<DoctorEntity>()
            .WithMany()
            .HasForeignKey(c => c.DoctorId)
            .HasConstraintName("FK_Consultations_Doctors_DoctorId")
            .OnDelete(DeleteBehavior.Restrict);

        // ── Cross-Module FK: AvailabilityId → DoctorAvailabilities.Id (SET NULL)
        builder.Property(c => c.AvailabilityId);

        builder.HasOne<DoctorAvailabilityEntity>()
            .WithMany()
            .HasForeignKey(c => c.AvailabilityId)
            .HasConstraintName("FK_Consultations_DoctorAvailabilities_AvailabilityId")
            .OnDelete(DeleteBehavior.SetNull);

        // ── Booking Identity ──────────────────────────────────────────────────
        builder.Property(c => c.ConsultationNumber)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(c => c.ConsultationNumber)
            .IsUnique()
            .HasDatabaseName("UQ_Consultations_ConsultationNumber");

        // ── Schedule Fields ───────────────────────────────────────────────────
        builder.Property(c => c.ScheduledDate)
            .IsRequired()
            .HasColumnType("date");

        // TimeOnly maps to PostgreSQL time without time zone via Npgsql
        builder.Property(c => c.StartTime)
            .IsRequired()
            .HasColumnType("time without time zone");

        builder.Property(c => c.EndTime)
            .IsRequired()
            .HasColumnType("time without time zone");

        builder.Property(c => c.TimeZone)
            .IsRequired()
            .HasMaxLength(100);

        // ── Status & Type ─────────────────────────────────────────────────────
        builder.Property(c => c.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(c => c.ConsultationType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        // ── Clinical Data ─────────────────────────────────────────────────────
        builder.Property(c => c.Symptoms)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(c => c.Notes)
            .HasColumnType("text");

        // ── Cancellation ──────────────────────────────────────────────────────
        builder.Property(c => c.CancellationReason)
            .HasColumnType("text");

        builder.Property(c => c.CancelledBy)
            .HasConversion<string>()
            .HasMaxLength(20);

        // ── Video Consultation Fields ─────────────────────────────────────────
        builder.Property(c => c.MeetingRoomId)
            .HasMaxLength(256);

        builder.Property(c => c.MeetingLink)
            .HasColumnType("text");

        builder.Property(c => c.MeetingStartedAt);

        builder.Property(c => c.MeetingEndedAt);

        // ── Fee Snapshot ──────────────────────────────────────────────────────
        builder.Property(c => c.ConsultationFeeSnapshot)
            .IsRequired()
            .HasColumnType("numeric(10,2)");

        // ── Follow-Up Chain ───────────────────────────────────────────────────
        builder.Property(c => c.IsFollowUp)
            .IsRequired();

        // Self-referencing FK: ParentConsultationId → Consultations.Id (SET NULL)
        builder.HasOne(c => c.ParentConsultation)
            .WithMany(c => c.FollowUps)
            .HasForeignKey(c => c.ParentConsultationId)
            .HasConstraintName("FK_Consultations_Consultations_ParentConsultationId")
            .OnDelete(DeleteBehavior.SetNull);

        // ── Audit Fields ──────────────────────────────────────────────────────
        builder.Property(c => c.CreatedAt)
            .IsRequired();

        // ── Soft Delete ───────────────────────────────────────────────────────
        builder.Property(c => c.DeletedAt);

        // Global query filter — all queries automatically exclude soft-deleted rows
        builder.HasQueryFilter(c => c.DeletedAt == null);

        // ── StatusHistories Relationship ──────────────────────────────────────
        builder.HasMany(c => c.StatusHistories)
            .WithOne(h => h.Consultation)
            .HasForeignKey(h => h.ConsultationId)
            .HasConstraintName("FK_ConsultationStatusHistories_Consultations_ConsultationId")
            .OnDelete(DeleteBehavior.Cascade);

        // ── Indexes ───────────────────────────────────────────────────────────
        builder.HasIndex(c => c.PatientId)
            .HasDatabaseName("IX_Consultations_PatientId");

        builder.HasIndex(c => c.DoctorId)
            .HasDatabaseName("IX_Consultations_DoctorId");

        builder.HasIndex(c => c.Status)
            .HasDatabaseName("IX_Consultations_Status");

        builder.HasIndex(c => new { c.ScheduledDate, c.DoctorId })
            .HasDatabaseName("IX_Consultations_ScheduledDate_DoctorId");

        // Partial index — only index active (non-deleted) rows
        builder.HasIndex(c => c.DeletedAt)
            .HasFilter("\"DeletedAt\" IS NULL")
            .HasDatabaseName("IX_Consultations_DeletedAt_Active");
    }
}
