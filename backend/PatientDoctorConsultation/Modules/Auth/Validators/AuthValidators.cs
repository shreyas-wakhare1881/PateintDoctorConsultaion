using FluentValidation;
using PatientDoctorConsultation.Modules.Auth.DTOs;

namespace PatientDoctorConsultation.Modules.Auth.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MinimumLength(2).WithMessage("Full name must be at least 2 characters.")
            .MaximumLength(256).WithMessage("Full name must not exceed 256 characters.")
            .Matches(@"^[a-zA-Z\s\.\-']+$").WithMessage("Full name can only contain letters, spaces, hyphens, apostrophes, and periods.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(256).WithMessage("Email must not exceed 256 characters.");

        RuleFor(x => x.PhoneNumber)
            .Matches(@"^\+[1-9]\d{1,14}$").WithMessage("Phone number must be in E.164 format (e.g., +911234567890).")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .MaximumLength(100).WithMessage("Password must not exceed 100 characters.")
            .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter.")
            .Matches(@"\d").WithMessage("Password must contain at least one digit.")
            .Matches(@"[^a-zA-Z\d]").WithMessage("Password must contain at least one special character.");

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty().WithMessage("Confirm password is required.")
            .Equal(x => x.Password).WithMessage("Passwords do not match.");

        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("Role is required.")
            .Must(r => string.Equals(r, "Doctor", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Only Doctor self-registration is permitted. Admin accounts are seeded only.");
    }
}

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(1).WithMessage("Password cannot be empty.");

        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("Role is required.")
            .Must(r => string.Equals(r, "Doctor", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Role must be Doctor or Admin. Patients use OTP login.");
    }
}

public class SendOtpRequestValidator : AbstractValidator<SendOtpRequest>
{
    public SendOtpRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.")
            .MaximumLength(256).WithMessage("Email must not exceed 256 characters.");
    }
}

public class VerifyOtpRequestValidator : AbstractValidator<VerifyOtpRequest>
{
    public VerifyOtpRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(x => x.Otp)
            .NotEmpty().WithMessage("OTP is required.")
            .Length(4, 6).WithMessage("OTP must be 4 to 6 digits.")
            .Matches(@"^\d+$").WithMessage("OTP must be numeric.");
    }
}

public class RefreshTokenRequestValidator : AbstractValidator<RefreshTokenRequest>
{
    public RefreshTokenRequestValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty().WithMessage("Refresh token is required.");
    }
}

public class UpdateProfileRequestValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        RuleFor(x => x.FullName)
            .MinimumLength(2).WithMessage("Full name must be at least 2 characters.")
            .MaximumLength(256).WithMessage("Full name must not exceed 256 characters.")
            .Matches(@"^[a-zA-Z\s\.\-']+$").WithMessage("Full name can only contain letters, spaces, hyphens, apostrophes, and periods.")
            .When(x => !string.IsNullOrWhiteSpace(x.FullName));

        RuleFor(x => x.PhoneNumber)
            .Matches(@"^\+[1-9]\d{1,14}$").WithMessage("Phone number must be in E.164 format (e.g., +911234567890).")
            .When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber));
    }
}
