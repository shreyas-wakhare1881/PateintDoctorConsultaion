using FluentValidation;
using Microsoft.EntityFrameworkCore;
using PatientDoctorConsultation.Infrastructure.Identity.Jwt;
using PatientDoctorConsultation.Infrastructure.Identity.OTP;
using PatientDoctorConsultation.Infrastructure.Identity.Passwords;
using PatientDoctorConsultation.Infrastructure.Persistence.Context;
using PatientDoctorConsultation.Modules.Auth.Interfaces;
using PatientDoctorConsultation.Modules.Auth.Mappings;
using PatientDoctorConsultation.Modules.Auth.Services;
using PatientDoctorConsultation.Modules.Auth.Validators;

namespace PatientDoctorConsultation.API.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        // ── Database ───────────────────────────────────────────────────────────
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        // ── Infrastructure — Identity ──────────────────────────────────────────
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddSingleton<IOtpService, OtpService>();
        services.AddSingleton<IPasswordService, PasswordService>();

        // ── Auth module ────────────────────────────────────────────────────────
        services.AddScoped<IAuthService, AuthService>();

        // ── AutoMapper ─────────────────────────────────────────────────────────
        services.AddAutoMapper(cfg => cfg.AddMaps(typeof(AuthMappingProfile).Assembly));

        // ── FluentValidation — register all validators from Auth module ────────
        services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

        return services;
    }
}
