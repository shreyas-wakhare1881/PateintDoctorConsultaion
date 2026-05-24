using Microsoft.EntityFrameworkCore;
using PatientDoctorConsultation.Infrastructure.Persistence.Context;
using PatientDoctorConsultation.Modules.Auth.Models;
using PatientDoctorConsultation.Modules.Patient.DTOs;
using PatientDoctorConsultation.Modules.Patient.Interfaces;
using PatientDoctorConsultation.Shared.Enums;
using PatientDoctorConsultation.Shared.Exceptions;
using PatientDoctorConsultation.Shared.Responses;
using DoctorModel = PatientDoctorConsultation.Modules.Doctor.Models.Doctor;
using PatientModel = PatientDoctorConsultation.Modules.Patient.Models.Patient;

namespace PatientDoctorConsultation.Modules.Patient.Services;

public sealed class PatientService(ApplicationDbContext db) : IPatientService
{
    // ════════════════════════════════════════════════════════════════════════
    // CREATE PROFILE
    // ════════════════════════════════════════════════════════════════════════

    public async Task<PatientProfileResponse> CreateProfileAsync(
        Guid userId,
        CreatePatientProfileRequest request,
        CancellationToken ct = default)
    {
        // 1. Verify active user with Patient role
        var user = await db.Set<User>()
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, ct)
            ?? throw new NotFoundException("User account not found or inactive.");

        if (user.Role != UserRole.Patient)
            throw new UnauthorizedException("Only Patient role accounts can create a patient profile.");

        // 2. Enforce one-profile-per-user constraint
        var profileExists = await db.Set<PatientModel>()
            .AnyAsync(p => p.UserId == userId, ct);

        if (profileExists)
            throw new ConflictException("A patient profile already exists for this account.");

        // 3. Build entity
        var patient = new PatientModel
        {
            UserId               = userId,
            Gender               = request.Gender?.Trim(),
            DateOfBirth          = request.DateOfBirth,
            BloodGroup           = request.BloodGroup?.Trim(),
            HeightCm             = request.HeightCm,
            WeightKg             = request.WeightKg,
            Allergies            = request.Allergies?.Trim(),
            ChronicDiseases      = request.ChronicDiseases?.Trim(),
            EmergencyContactName = request.EmergencyContactName?.Trim(),
            EmergencyContactPhone= request.EmergencyContactPhone?.Trim(),
            Address              = request.Address?.Trim(),
            City                 = request.City?.Trim(),
            State                = request.State?.Trim(),
            Country              = request.Country?.Trim(),
            IsProfileCompleted   = false,
            CreatedAt            = DateTime.UtcNow
        };

        // 4. Evaluate completeness
        patient.IsProfileCompleted = EvaluateProfileCompleted(patient);

        db.Set<PatientModel>().Add(patient);
        await db.SaveChangesAsync(ct);

        return BuildProfileResponse(patient, user);
    }

    // ════════════════════════════════════════════════════════════════════════
    // GET MY PROFILE
    // ════════════════════════════════════════════════════════════════════════

    public async Task<PatientProfileResponse> GetMyProfileAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var (patient, user) = await FetchPatientWithUserAsync(userId, ct);
        return BuildProfileResponse(patient, user);
    }

    // ════════════════════════════════════════════════════════════════════════
    // UPDATE PROFILE (partial)
    // ════════════════════════════════════════════════════════════════════════

    public async Task<PatientProfileResponse> UpdateProfileAsync(
        Guid userId,
        UpdatePatientProfileRequest request,
        CancellationToken ct = default)
    {
        var (patient, user) = await FetchPatientWithUserAsync(userId, ct);

        // Apply only non-null fields — PUT with PATCH semantics
        if (request.Gender               is not null) patient.Gender               = request.Gender.Trim();
        if (request.DateOfBirth.HasValue)              patient.DateOfBirth           = request.DateOfBirth.Value;
        if (request.BloodGroup           is not null) patient.BloodGroup            = request.BloodGroup.Trim();
        if (request.HeightCm.HasValue)                 patient.HeightCm              = request.HeightCm.Value;
        if (request.WeightKg.HasValue)                 patient.WeightKg              = request.WeightKg.Value;
        if (request.Allergies            is not null) patient.Allergies             = request.Allergies.Trim();
        if (request.ChronicDiseases      is not null) patient.ChronicDiseases       = request.ChronicDiseases.Trim();
        if (request.EmergencyContactName is not null) patient.EmergencyContactName  = request.EmergencyContactName.Trim();
        if (request.EmergencyContactPhone is not null) patient.EmergencyContactPhone = request.EmergencyContactPhone.Trim();
        if (request.Address              is not null) patient.Address               = request.Address.Trim();
        if (request.City                 is not null) patient.City                  = request.City.Trim();
        if (request.State                is not null) patient.State                 = request.State.Trim();
        if (request.Country              is not null) patient.Country               = request.Country.Trim();

        // Re-evaluate profile completeness after any update
        patient.IsProfileCompleted = EvaluateProfileCompleted(patient);
        patient.UpdatedAt          = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return BuildProfileResponse(patient, user);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SOFT DELETE
    // ════════════════════════════════════════════════════════════════════════

    public async Task DeleteProfileAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        // Global query filter (DeletedAt == null) is bypassed with IgnoreQueryFilters
        // so that a double-delete returns 404 properly
        var patient = await db.Set<PatientModel>()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct)
            ?? throw new NotFoundException("Patient profile not found.");

        // If already soft-deleted — surface as 404
        if (patient.DeletedAt is not null)
            throw new NotFoundException("Patient profile not found.");

        patient.DeletedAt = DateTime.UtcNow;
        patient.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    // ════════════════════════════════════════════════════════════════════════
    // GET DOCTORS — patient-scoped discovery proxy
    // ════════════════════════════════════════════════════════════════════════

    public async Task<PaginatedResponse<PatientDoctorDiscoveryItem>> GetDoctorsAsync(
        PatientDoctorListQuery query,
        CancellationToken ct = default)
    {
        // Sanitize pagination
        var page     = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 50);

        // Base query: only publicly visible, approved doctors
        var baseQuery =
            from d in db.Set<DoctorModel>()
            join u in db.Set<User>() on d.UserId equals u.Id
            where d.IsPubliclyVisible && d.ApprovalStatus == ApprovalStatus.Approved
            select new { Doctor = d, User = u };

        // Optional filters — case-insensitive via ToLower() → translates to lower() in PostgreSQL
        if (!string.IsNullOrWhiteSpace(query.City))
        {
            var city = query.City.Trim().ToLower();
            baseQuery = baseQuery.Where(x =>
                x.Doctor.City != null && x.Doctor.City.ToLower().Contains(city));
        }

        if (!string.IsNullOrWhiteSpace(query.Specialization))
        {
            var spec = query.Specialization.Trim().ToLower();
            baseQuery = baseQuery.Where(x =>
                x.Doctor.Specialization != null && x.Doctor.Specialization.ToLower().Contains(spec));
        }

        if (!string.IsNullOrWhiteSpace(query.Language))
        {
            var lang = query.Language.Trim();
            baseQuery = baseQuery.Where(x =>
                x.Doctor.LanguagesSpoken != null && x.Doctor.LanguagesSpoken.Contains(lang));
        }

        if (query.MinFee.HasValue)
            baseQuery = baseQuery.Where(x => x.Doctor.ConsultationFee >= query.MinFee.Value);

        if (query.MaxFee.HasValue)
            baseQuery = baseQuery.Where(x => x.Doctor.ConsultationFee <= query.MaxFee.Value);

        var totalCount = await baseQuery.CountAsync(ct);

        var items = await baseQuery
            .OrderByDescending(x => x.Doctor.Rating)
            .ThenBy(x => x.Doctor.City)
            .ThenBy(x => x.User.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new PatientDoctorDiscoveryItem(
                x.Doctor.Id,
                x.User.FullName,
                x.Doctor.Specialization,
                x.Doctor.Qualification,
                x.Doctor.ExperienceYears,
                x.Doctor.ConsultationFee,
                x.Doctor.Rating,
                x.Doctor.TotalReviews,
                x.Doctor.City,
                x.Doctor.LanguagesSpoken == null
                    ? (IReadOnlyList<string>)Array.Empty<string>()
                    : x.Doctor.LanguagesSpoken,
                x.Doctor.ProfileImageUrl))
            .ToListAsync(ct);

        return PaginatedResponse<PatientDoctorDiscoveryItem>.Create(items, totalCount, page, pageSize);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ════════════════════════════════════════════════════════════════════════

    private async Task<(PatientModel Patient, User User)> FetchPatientWithUserAsync(
        Guid userId, CancellationToken ct)
    {
        var user = await db.Set<User>()
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, ct)
            ?? throw new NotFoundException("User account not found or inactive.");

        var patient = await db.Set<PatientModel>()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct)
            ?? throw new NotFoundException("Patient profile not found. Please create your profile first.");

        return (patient, user);
    }

    /// <summary>
    /// Profile is considered complete when all four clinically mandatory fields are present.
    /// Per SDD: Gender, DateOfBirth, BloodGroup, City.
    /// </summary>
    private static bool EvaluateProfileCompleted(PatientModel p) =>
        !string.IsNullOrWhiteSpace(p.Gender)
        && p.DateOfBirth.HasValue
        && !string.IsNullOrWhiteSpace(p.BloodGroup)
        && !string.IsNullOrWhiteSpace(p.City);

    private static PatientProfileResponse BuildProfileResponse(PatientModel p, User u) =>
        new(p.Id,
            p.UserId,
            u.FullName,
            u.Email ?? string.Empty,
            p.Gender,
            p.DateOfBirth,
            p.BloodGroup,
            p.HeightCm,
            p.WeightKg,
            p.Allergies,
            p.ChronicDiseases,
            p.EmergencyContactName,
            p.EmergencyContactPhone,
            p.Address,
            p.City,
            p.State,
            p.Country,
            p.ProfileImageUrl,
            p.IsProfileCompleted,
            p.CreatedAt,
            p.UpdatedAt);
}

