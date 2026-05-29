using FluentValidation;
using PatientDoctorConsultation.Modules.DoctorDiscovery.DTOs;

namespace PatientDoctorConsultation.Modules.DoctorDiscovery.Validators;

/// <summary>
/// Validates the public doctor-discovery search request.
/// Rules are intentionally lenient — we want to return results, not reject queries.
/// Hard validation is reserved for structural invariants (page numbers, page size).
/// </summary>
public sealed class DoctorSearchRequestValidator : AbstractValidator<DoctorSearchRequest>
{
    private static readonly string[] AllowedSortFields = { "fee", "experience", "rating", "name" };
    private static readonly string[] AllowedSortDirections = { "asc", "desc" };

    public DoctorSearchRequestValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page must be at least 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50)
            .WithMessage("PageSize must be between 1 and 50.");

        RuleFor(x => x.MinExperience)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MinExperience.HasValue)
            .WithMessage("MinExperience must be 0 or greater.");

        RuleFor(x => x.MaxExperience)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MaxExperience.HasValue)
            .WithMessage("MaxExperience must be 0 or greater.");

        RuleFor(x => x)
            .Must(x => !x.MinExperience.HasValue || !x.MaxExperience.HasValue ||
                       x.MinExperience.Value <= x.MaxExperience.Value)
            .WithMessage("MinExperience must be less than or equal to MaxExperience.");

        RuleFor(x => x.MinConsultationFee)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MinConsultationFee.HasValue)
            .WithMessage("MinConsultationFee must be 0 or greater.");

        RuleFor(x => x.MaxConsultationFee)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MaxConsultationFee.HasValue)
            .WithMessage("MaxConsultationFee must be 0 or greater.");

        RuleFor(x => x)
            .Must(x => !x.MinConsultationFee.HasValue || !x.MaxConsultationFee.HasValue ||
                       x.MinConsultationFee.Value <= x.MaxConsultationFee.Value)
            .WithMessage("MinConsultationFee must be less than or equal to MaxConsultationFee.");

        RuleFor(x => x.SortBy)
            .Must(s => s == null || AllowedSortFields.Contains(s, StringComparer.OrdinalIgnoreCase))
            .WithMessage($"SortBy must be one of: {string.Join(", ", AllowedSortFields)}.");

        RuleFor(x => x.SortDirection)
            .Must(d => AllowedSortDirections.Contains(d, StringComparer.OrdinalIgnoreCase))
            .WithMessage("SortDirection must be 'asc' or 'desc'.");

        RuleFor(x => x.SearchTerm)
            .MaximumLength(200)
            .When(x => x.SearchTerm != null)
            .WithMessage("SearchTerm must not exceed 200 characters.");
    }
}
