using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PatientDoctorConsultation.Modules.Admin.Models;
using UserEntity = PatientDoctorConsultation.Modules.Auth.Models.User;

namespace PatientDoctorConsultation.Modules.Admin.Configurations;

public class AdminAuditLogConfiguration : IEntityTypeConfiguration<AdminAuditLog>
{
    public void Configure(EntityTypeBuilder<AdminAuditLog> builder)
    {
        // ── Table ─────────────────────────────────────────────────────────────
        builder.ToTable("AdminAuditLogs");

        // ── Primary Key ───────────────────────────────────────────────────────
        builder.HasKey(a => a.Id);

        // ── Cross-Module FK: AdminUserId → Users.Id (RESTRICT) ───────────────
        // Admin operator identity lives in the Auth module's Users table.
        // RESTRICT: audit logs must never be orphaned when a user is deactivated.
        builder.Property(a => a.AdminUserId)
            .IsRequired();

        builder.HasOne(a => a.AdminUser)
            .WithMany()
            .HasForeignKey(a => a.AdminUserId)
            .HasConstraintName("FK_AdminAuditLogs_Users_AdminUserId")
            .OnDelete(DeleteBehavior.Restrict);

        // ── ActionType ────────────────────────────────────────────────────────
        // Stored as VARCHAR(50) string — human-readable in the DB, query-friendly.
        builder.Property(a => a.ActionType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        // ── TargetEntityType ──────────────────────────────────────────────────
        // Stored as VARCHAR(50) string — identifies which entity was acted upon.
        builder.Property(a => a.TargetEntityType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        // ── TargetEntityId ────────────────────────────────────────────────────
        // Polymorphic logical FK — enforced at application layer, not DB level,
        // because the target can be Doctor, Patient, or Consultation.
        builder.Property(a => a.TargetEntityId)
            .IsRequired();

        // ── Reason ────────────────────────────────────────────────────────────
        builder.Property(a => a.Reason)
            .HasColumnType("text");

        // ── MetadataJson ──────────────────────────────────────────────────────
        // Stored as PostgreSQL jsonb for efficient indexing and querying.
        builder.Property(a => a.MetadataJson)
            .HasColumnType("jsonb");

        // ── CreatedAt ─────────────────────────────────────────────────────────
        // timestamptz — always stored in UTC. Immutable after INSERT.
        builder.Property(a => a.CreatedAt)
            .IsRequired()
            .HasColumnType("timestamptz");

        // ── Indexes ───────────────────────────────────────────────────────────

        // IX_AdminAuditLogs_AdminUserId — audit trail per admin operator
        builder.HasIndex(a => a.AdminUserId)
            .HasDatabaseName("IX_AdminAuditLogs_AdminUserId");

        // IX_AdminAuditLogs_TargetEntityId — fetch all actions against a specific entity
        builder.HasIndex(a => a.TargetEntityId)
            .HasDatabaseName("IX_AdminAuditLogs_TargetEntityId");

        // IX_AdminAuditLogs_CreatedAt — chronological audit feed, dashboard queries
        builder.HasIndex(a => a.CreatedAt)
            .HasDatabaseName("IX_AdminAuditLogs_CreatedAt")
            .IsDescending(true);
    }
}
