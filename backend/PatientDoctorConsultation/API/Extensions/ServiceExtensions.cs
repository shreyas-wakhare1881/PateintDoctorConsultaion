using FluentValidation;
using Microsoft.EntityFrameworkCore;
using PatientDoctorConsultation.Infrastructure.Identity.Jwt;
using PatientDoctorConsultation.Infrastructure.Identity.OTP;
using PatientDoctorConsultation.Infrastructure.Identity.Passwords;
using PatientDoctorConsultation.Infrastructure.Persistence.Context;
using PatientDoctorConsultation.Modules.Admin.Interfaces;
using PatientDoctorConsultation.Modules.Admin.Mappings;
using PatientDoctorConsultation.Modules.Admin.Services;
using PatientDoctorConsultation.Modules.Admin.Validators;
using PatientDoctorConsultation.Modules.Auth.Interfaces;
using PatientDoctorConsultation.Modules.Auth.Mappings;
using PatientDoctorConsultation.Modules.Auth.Services;
using PatientDoctorConsultation.Modules.Auth.Validators;
using PatientDoctorConsultation.Modules.Consultation.Interfaces;
using PatientDoctorConsultation.Modules.Consultation.Mappings;
using PatientDoctorConsultation.Modules.Consultation.Services;
using PatientDoctorConsultation.Modules.Consultation.Validators;
using PatientDoctorConsultation.Modules.Doctor.Interfaces;
using PatientDoctorConsultation.Modules.Doctor.Mappings;
using PatientDoctorConsultation.Modules.Doctor.Services;
using PatientDoctorConsultation.Modules.Doctor.Validators;
using PatientDoctorConsultation.Modules.Patient.Interfaces;
using PatientDoctorConsultation.Modules.Patient.Mappings;
using PatientDoctorConsultation.Modules.Patient.Services;
using PatientDoctorConsultation.Modules.Patient.Validators;

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

        // ── Doctor module ──────────────────────────────────────────────────────
        services.AddScoped<IDoctorService, DoctorService>();

        // ── Patient module ─────────────────────────────────────────────────────────
        services.AddScoped<IPatientService, PatientService>();

        // ── Consultation module ────────────────────────────────────────────────
        services.AddScoped<IConsultationService, ConsultationService>();

        // ── Admin module ───────────────────────────────────────────────────────
        services.AddScoped<IAdminService, AdminService>();

        // ── AutoMapper ─────────────────────────────────────────────────────────
        services.AddAutoMapper(cfg =>
        {
            cfg.AddMaps(typeof(AuthMappingProfile).Assembly);
            cfg.AddMaps(typeof(DoctorMappingProfile).Assembly);
            cfg.AddMaps(typeof(PatientMappingProfile).Assembly);
            cfg.AddMaps(typeof(ConsultationMappingProfile).Assembly);
            cfg.AddMaps(typeof(AdminMappingProfile).Assembly);
        });

        // ── FluentValidation — Auth module ─────────────────────────────────────
        services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

        // ── FluentValidation — Doctor module ───────────────────────────────────
        services.AddValidatorsFromAssemblyContaining<CreateDoctorProfileRequestValidator>();

        // ── FluentValidation — Patient module ──────────────────────────────────
        services.AddValidatorsFromAssemblyContaining<CreatePatientProfileRequestValidator>();

        // ── FluentValidation — Consultation module ─────────────────────────────
        services.AddValidatorsFromAssemblyContaining<BookConsultationRequestValidator>();

        // ── FluentValidation — Admin module ────────────────────────────────────
        services.AddValidatorsFromAssemblyContaining<DoctorRejectRequestValidator>();

        return services;
    }
}


