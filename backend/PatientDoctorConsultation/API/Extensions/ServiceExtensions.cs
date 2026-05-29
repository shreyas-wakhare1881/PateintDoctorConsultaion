using FluentValidation;
using Microsoft.EntityFrameworkCore;
using PatientDoctorConsultation.Infrastructure.Identity.Jwt;
using PatientDoctorConsultation.Infrastructure.Identity.OTP;
using PatientDoctorConsultation.Infrastructure.Identity.Passwords;
using PatientDoctorConsultation.Infrastructure.Realtime.LiveKit;
using PatientDoctorConsultation.Infrastructure.Realtime.SignalR;
using PatientDoctorConsultation.Infrastructure.Persistence.Context;
using PatientDoctorConsultation.API.Hubs;
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
using PatientDoctorConsultation.Modules.DoctorDiscovery.Interfaces;
using PatientDoctorConsultation.Modules.DoctorDiscovery.NLP;
using PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Fuzzy;
using PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Ranking;
using PatientDoctorConsultation.Modules.DoctorDiscovery.NLP.Semantic;
using PatientDoctorConsultation.Modules.DoctorDiscovery.Repositories;
using PatientDoctorConsultation.Modules.DoctorDiscovery.Services;
using PatientDoctorConsultation.Modules.DoctorDiscovery.Validators;
using PatientDoctorConsultation.Modules.Shared.Interfaces;
using PatientDoctorConsultation.Modules.Patient.Interfaces;
using PatientDoctorConsultation.Modules.Patient.Mappings;
using PatientDoctorConsultation.Modules.Patient.Services;
using PatientDoctorConsultation.Modules.Patient.Validators;
using PatientDoctorConsultation.Modules.Prescription.Interfaces;
using PatientDoctorConsultation.Modules.Prescription.Services;

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
        services.AddHttpClient<ILiveKitService, LiveKitService>();
        services.AddScoped<ISignalRNotificationService, SignalRNotificationService<NotificationHub>>();

        // ── Auth module ────────────────────────────────────────────────────────
        services.AddScoped<IAuthService, AuthService>();

        // ── Doctor module ──────────────────────────────────────────────────────
        services.AddScoped<IDoctorService, DoctorService>();
        services.AddScoped<IDoctorStubCreator, DoctorStubCreator>();

        // ── Doctor Discovery module ────────────────────────────────────────────
        services.AddScoped<IDoctorDiscoveryRepository, DoctorDiscoveryRepository>();
        services.AddScoped<IDoctorDiscoveryService, DoctorDiscoveryService>();
        services.AddScoped<ISearchAnalyticsRepository, SearchAnalyticsRepository>();

        // ── NLP Search Foundation ──────────────────────────────────────────────
        // Singletons: stateless services backed by static MedicalDictionary data.
        services.AddSingleton<IQueryNormalizer, QueryNormalizer>();
        services.AddSingleton<IMedicalSynonymService, MedicalSynonymService>();
        services.AddSingleton<IIntentParser, IntentParser>();

        // Sprint 3+4: Fuzzy, Ranking, Semantic — all Singleton (no DB access).
        services.AddSingleton<IFuzzySearchService, FuzzySearchService>();
        services.AddSingleton<ISearchRankingService, SearchRankingService>();
        services.AddSingleton<ISemanticSearchProvider, DictionarySemanticSearchProvider>();

        // Scoped: services that depend on scoped repositories.
        services.AddScoped<INlpSearchService, NlpSearchService>();
        services.AddScoped<ISuggestionService, SuggestionService>();

        // ── Patient module ─────────────────────────────────────────────────────────
        services.AddScoped<IPatientService, PatientService>();

        // ── Consultation module ────────────────────────────────────────────────
        services.AddScoped<IConsultationService, ConsultationService>();

        // ── Admin module ───────────────────────────────────────────────────────
        services.AddScoped<IAdminService, AdminService>();

        // ── Prescription module ────────────────────────────────────────────────
        services.AddScoped<IPrescriptionService, PrescriptionService>();

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

        // ── FluentValidation — Doctor Discovery module ─────────────────────────
        services.AddValidatorsFromAssemblyContaining<DoctorSearchRequestValidator>();

        return services;
    }
}


