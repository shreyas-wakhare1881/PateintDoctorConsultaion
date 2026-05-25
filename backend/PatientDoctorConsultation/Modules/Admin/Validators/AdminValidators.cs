using FluentValidation;
using PatientDoctorConsultation.Modules.Admin.DTOs;

namespace PatientDoctorConsultation.Modules.Admin.Validators;

// ════════════════════════════════════════════════════════════════════════════
// DOCTOR MODERATION
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Validates reject/suspend requests — reason is required for both.</summary>
public class DoctorRejectRequestValidator : AbstractValidator<DoctorModerationRequest>
{
    public DoctorRejectRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required when rejecting a doctor.")
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters.");
    }
}

/// <summary>Validates approve/reactivate requests — reason is optional.</summary>
public class DoctorApproveRequestValidator : AbstractValidator<DoctorModerationRequest>
{
    public DoctorApproveRequestValidator()
    {
        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters.")
            .When(x => x.Reason is not null);
    }
}

/// <summary>Validates doctor list query parameters.</summary>
public class AdminDoctorListQueryValidator : AbstractValidator<AdminDoctorListQuery>
{
    private static readonly string[] ValidStatuses = ["Pending", "Approved", "Rejected", "Suspended"];

    public AdminDoctorListQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page must be at least 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("PageSize must be between 1 and 100.");

        RuleFor(x => x.ApprovalStatus)
            .Must(s => s is null || ValidStatuses.Contains(s))
            .WithMessage($"ApprovalStatus must be one of: {string.Join(", ", ValidStatuses)}.");
    }
}

// ════════════════════════════════════════════════════════════════════════════
// PATIENT MODERATION
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Validates patient block request — reason is required.</summary>
public class PatientBlockRequestValidator : AbstractValidator<PatientModerationRequest>
{
    public PatientBlockRequestValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required when blocking a patient.")
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters.");
    }
}

/// <summary>Validates patient unblock request — reason is optional.</summary>
public class PatientUnblockRequestValidator : AbstractValidator<PatientModerationRequest>
{
    public PatientUnblockRequestValidator()
    {
        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters.")
            .When(x => x.Reason is not null);
    }
}

/// <summary>Validates patient list query parameters.</summary>
public class AdminPatientListQueryValidator : AbstractValidator<AdminPatientListQuery>
{
    public AdminPatientListQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page must be at least 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("PageSize must be between 1 and 100.");
    }
}

// ════════════════════════════════════════════════════════════════════════════
// CONSULTATION MONITORING
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Validates admin consultation list query parameters.</summary>
public class AdminConsultationListQueryValidator : AbstractValidator<AdminConsultationListQuery>
{
    public AdminConsultationListQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page must be at least 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("PageSize must be between 1 and 100.");

        RuleFor(x => x.DateFrom)
            .LessThanOrEqualTo(x => x.DateTo)
            .When(x => x.DateFrom.HasValue && x.DateTo.HasValue)
            .WithMessage("DateFrom must be on or before DateTo.");
    }
}

// ════════════════════════════════════════════════════════════════════════════
// AUDIT LOGS
// ════════════════════════════════════════════════════════════════════════════

/// <summary>Validates admin audit log query parameters.</summary>
public class AdminAuditLogQueryValidator : AbstractValidator<AdminAuditLogQuery>
{
    public AdminAuditLogQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page must be at least 1.");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("PageSize must be between 1 and 100.");
    }
}

