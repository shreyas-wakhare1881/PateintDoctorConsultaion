using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PatientDoctorConsultation.Modules.DoctorDiscovery.Analytics;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.Persistence.Configurations;

/// <summary>
/// EF Fluent configuration for <see cref="SearchQuery"/>.
/// Auto-discovered by <c>ApplicationDbContext.OnModelCreating</c> via assembly scan.
/// </summary>
public sealed class SearchQueryConfiguration : IEntityTypeConfiguration<SearchQuery>
{
    public void Configure(EntityTypeBuilder<SearchQuery> builder)
    {
        builder.ToTable("SearchQueries");

        builder.HasKey(q => q.Id);

        builder.Property(q => q.Query)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(q => q.ParsedIntentJson)
            .HasColumnType("text");

        builder.Property(q => q.SearchSource)
            .HasMaxLength(50)
            .IsRequired()
            .HasDefaultValue("nlp");

        builder.Property(q => q.ResultCount)
            .IsRequired();

        builder.Property(q => q.CreatedAt)
            .IsRequired();

        // ── Indexes ────────────────────────────────────────────────────────────
        // Patient-level analytics (all searches by a patient)
        builder.HasIndex(q => q.PatientId)
            .HasDatabaseName("IX_SearchQueries_PatientId");

        // Time-range analytics (searches per day/week)
        builder.HasIndex(q => q.CreatedAt)
            .HasDatabaseName("IX_SearchQueries_CreatedAt");

        // Source breakdown (nlp vs structured)
        builder.HasIndex(q => q.SearchSource)
            .HasDatabaseName("IX_SearchQueries_SearchSource");

        // V2 analytics fields
        builder.Property(q => q.NormalizedQuery)
            .HasMaxLength(1000);

        builder.Property(q => q.ConfidenceScore)
            .HasColumnType("double precision");

        // V3 analytics fields (Sprint 3)
        builder.Property(q => q.DidYouMeanQuery)
            .HasMaxLength(1000);

        builder.Property(q => q.FuzzyMatchApplied)
            .IsRequired()
            .HasDefaultValue(false);

        // TopResultId is nullable Guid — no extra config needed (default mapping is correct)
    }
}
