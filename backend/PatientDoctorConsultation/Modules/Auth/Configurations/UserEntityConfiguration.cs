using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PatientDoctorConsultation.Modules.Auth.Models;

namespace PatientDoctorConsultation.Modules.Auth.Configurations;

public class UserEntityConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.FullName)
            .IsRequired();

        builder.Property(u => u.Email)
            .HasMaxLength(256);

        // Partial unique index: only one non-null email per row.
        // Phone-only patients (Email = null) are excluded and do not conflict.
        builder.HasIndex(u => u.Email)
            .IsUnique()
            .HasFilter("\"Email\" IS NOT NULL");

        builder.Property(u => u.PhoneNumber)
            .IsRequired();

        builder.Property(u => u.PasswordHash)
            .IsRequired();

        builder.Property(u => u.Role)
            .HasConversion<string>()
            .IsRequired();

        builder.Property(u => u.IsActive)
            .IsRequired();

        builder.Property(u => u.IsVerified)
            .IsRequired();

        builder.Property(u => u.CreatedAt)
            .IsRequired();
    }
}
