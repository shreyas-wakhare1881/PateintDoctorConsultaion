using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatientDoctorConsultation.Infrastructure.Persistence.Context;
using PatientDoctorConsultation.Modules.Auth.Models;
using PatientDoctorConsultation.Modules.Doctor.DTOs;
using PatientDoctorConsultation.Modules.Doctor.Interfaces;
using PatientDoctorConsultation.Shared.Enums;
using PatientDoctorConsultation.Shared.Exceptions;
using PatientDoctorConsultation.Shared.Responses;
using DoctorModel = PatientDoctorConsultation.Modules.Doctor.Models.Doctor;
using AvailabilityModel = PatientDoctorConsultation.Modules.Doctor.Models.DoctorAvailability;

namespace PatientDoctorConsultation.Modules.Doctor.Services;

public sealed class DoctorService(ApplicationDbContext db, ILogger<DoctorService> logger) : IDoctorService
{
    // ════════════════════════════════════════════════════════════════════════
    // CREATE PROFILE
    // ════════════════════════════════════════════════════════════════════════

    public async Task<DoctorProfileResponse> CreateProfileAsync(
        Guid userId,
        CreateDoctorProfileRequest request,
        CancellationToken ct = default)
    {
        // 1. Verify active user with Doctor role
        var user = await db.Set<User>()
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, ct)
            ?? throw new NotFoundException("User account not found or inactive.");

        if (user.Role != UserRole.Doctor)
            throw new UnauthorizedException("Only Doctor role accounts can create a doctor profile.");

        // 2. Find existing stub (created automatically at registration per SDD Flow §1)
        var existingStub = await db.Set<DoctorModel>()
            .FirstOrDefaultAsync(d => d.UserId == userId, ct);

        // 2a. If profile is already fully completed, disallow re-submission (409)
        if (existingStub is not null && existingStub.IsProfileCompleted)
            throw new ConflictException("Doctor profile is already completed. Use PATCH /api/doctors/profile/me to update.");

        // 3. License number must be globally unique (exclude self when updating stub)
        var selfId = existingStub?.Id ?? Guid.Empty;
        var licenseExists = await db.Set<DoctorModel>()
            .AnyAsync(d => d.LicenseNumber == request.LicenseNumber.Trim() && d.Id != selfId, ct);

        if (licenseExists)
            throw new ConflictException($"License number '{request.LicenseNumber}' is already registered on the platform.");

        DoctorModel doctor;

        if (existingStub is not null)
        {
            // 4a. UPDATE existing stub — doctor registered first, now completing profile
            doctor = existingStub;
            doctor.Specialization      = request.Specialization.Trim();
            doctor.Qualification       = request.Qualification.Trim();
            doctor.ExperienceYears     = request.ExperienceYears;
            doctor.LicenseNumber       = request.LicenseNumber.Trim();
            doctor.Bio                 = request.Bio?.Trim();
            doctor.ProfileImageUrl     = request.ProfileImageUrl?.Trim();
            doctor.ConsultationFee     = request.ConsultationFee;
            doctor.HospitalName        = request.HospitalName?.Trim();
            doctor.ClinicAddress       = request.ClinicAddress?.Trim();
            doctor.City                = request.City.Trim();
            doctor.State               = request.State?.Trim();
            doctor.Country             = request.Country?.Trim();
            doctor.LanguagesSpoken     = NormalizeLanguages(request.LanguagesSpoken);
            // Keep normalized columns in sync
            doctor.SpecializationNormalized = NormalizeSearchText(request.Specialization);
            doctor.CityNormalized           = NormalizeSearchText(request.City);
            doctor.UpdatedAt           = DateTime.UtcNow;

            logger.LogInformation("Doctor profile stub updated during setup. UserId={UserId}", userId);
        }
        else
        {
            // 4b. CREATE new row — fallback path (stub was not created at registration)
            doctor = new DoctorModel
            {
                UserId              = userId,
                Specialization      = request.Specialization.Trim(),
                Qualification       = request.Qualification.Trim(),
                ExperienceYears     = request.ExperienceYears,
                LicenseNumber       = request.LicenseNumber.Trim(),
                Bio                 = request.Bio?.Trim(),
                ProfileImageUrl     = request.ProfileImageUrl?.Trim(),
                ConsultationFee     = request.ConsultationFee,
                HospitalName        = request.HospitalName?.Trim(),
                ClinicAddress       = request.ClinicAddress?.Trim(),
                City                = request.City.Trim(),
                State               = request.State?.Trim(),
                Country             = request.Country?.Trim(),
                LanguagesSpoken     = NormalizeLanguages(request.LanguagesSpoken),
                SpecializationNormalized = NormalizeSearchText(request.Specialization),
                CityNormalized           = NormalizeSearchText(request.City),
                ApprovalStatus      = ApprovalStatus.Pending,
                IsProfileCompleted  = false,
                IsPubliclyVisible   = false,
                TotalReviews        = 0,
                TotalConsultations  = 0,
                CreatedAt           = DateTime.UtcNow
            };
            db.Set<DoctorModel>().Add(doctor);

            logger.LogInformation("Doctor profile created (no prior stub). UserId={UserId}", userId);
        }

        // 5. Evaluate completeness after all fields are set
        doctor.IsProfileCompleted = EvaluateProfileCompleted(doctor);

        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "Doctor profile setup complete. UserId={UserId} IsProfileCompleted={Completed}",
            userId, doctor.IsProfileCompleted);

        return BuildDoctorProfileResponse(doctor, user);
    }

    // ════════════════════════════════════════════════════════════════════════
    // GET MY PROFILE
    // ════════════════════════════════════════════════════════════════════════

    public async Task<DoctorProfileResponse> GetMyProfileAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var (doctor, user) = await FetchDoctorWithUserAsync(userId, ct);
        return BuildDoctorProfileResponse(doctor, user);
    }

    // ════════════════════════════════════════════════════════════════════════
    // UPDATE MY PROFILE
    // ════════════════════════════════════════════════════════════════════════

    public async Task<DoctorProfileResponse> UpdateMyProfileAsync(
        Guid userId,
        UpdateDoctorProfileRequest request,
        CancellationToken ct = default)
    {
        var (doctor, user) = await FetchDoctorWithUserAsync(userId, ct);

        // License uniqueness check (only if value is actually changing)
        if (request.LicenseNumber is not null &&
            !string.Equals(request.LicenseNumber.Trim(), doctor.LicenseNumber, StringComparison.OrdinalIgnoreCase))
        {
            var licenseExists = await db.Set<DoctorModel>()
                .AnyAsync(d => d.LicenseNumber == request.LicenseNumber.Trim() && d.Id != doctor.Id, ct);

            if (licenseExists)
                throw new ConflictException($"License number '{request.LicenseNumber}' is already registered on the platform.");
        }

        // Apply partial updates — only non-null fields are changed
        if (request.Specialization  is not null) doctor.Specialization  = request.Specialization.Trim();
        if (request.Qualification   is not null) doctor.Qualification   = request.Qualification.Trim();
        if (request.ExperienceYears.HasValue)    doctor.ExperienceYears  = request.ExperienceYears.Value;
        if (request.LicenseNumber   is not null) doctor.LicenseNumber   = request.LicenseNumber.Trim();
        if (request.Bio             is not null) doctor.Bio             = request.Bio.Trim();
        if (request.ProfileImageUrl is not null) doctor.ProfileImageUrl = request.ProfileImageUrl.Trim();
        if (request.ConsultationFee.HasValue)    doctor.ConsultationFee  = request.ConsultationFee.Value;
        if (request.HospitalName    is not null) doctor.HospitalName    = request.HospitalName.Trim();
        if (request.ClinicAddress   is not null) doctor.ClinicAddress   = request.ClinicAddress.Trim();
        if (request.City            is not null) { doctor.City = request.City.Trim(); doctor.CityNormalized = NormalizeSearchText(request.City); }
        if (request.State           is not null) doctor.State           = request.State.Trim();
        if (request.Country         is not null) doctor.Country         = request.Country.Trim();
        if (request.LanguagesSpoken is not null) doctor.LanguagesSpoken  = NormalizeLanguages(request.LanguagesSpoken);
        if (request.Specialization  is not null) { doctor.Specialization = request.Specialization.Trim(); doctor.SpecializationNormalized = NormalizeSearchText(request.Specialization); }

        // Re-evaluate profile completeness and public visibility
        doctor.IsProfileCompleted = EvaluateProfileCompleted(doctor);

        // Rejected doctors are re-submitted for moderation once profile updates are complete.
        if (doctor.ApprovalStatus == ApprovalStatus.Rejected && doctor.IsProfileCompleted)
            doctor.ApprovalStatus = ApprovalStatus.Pending;

        doctor.IsPubliclyVisible  = doctor.ApprovalStatus == ApprovalStatus.Approved && doctor.IsProfileCompleted;
        doctor.UpdatedAt          = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        logger.LogInformation("Doctor profile updated. UserId={UserId}", userId);

        return BuildDoctorProfileResponse(doctor, user);
    }

    // ════════════════════════════════════════════════════════════════════════
    // ADD AVAILABILITY SLOT
    // ════════════════════════════════════════════════════════════════════════

    public async Task<AvailabilityResponse> AddAvailabilityAsync(
        Guid userId,
        CreateAvailabilityRequest request,
        CancellationToken ct = default)
    {
        var doctor = await FetchDoctorByUserIdAsync(userId, ct);

        // Only approved doctors can configure availability
        if (doctor.ApprovalStatus != ApprovalStatus.Approved)
            throw DomainValidationException.For(
                "ApprovalStatus",
                "Only approved doctors can configure availability slots.");

        var startTime = TimeOnly.Parse(request.StartTime);
        var endTime   = TimeOnly.Parse(request.EndTime);

        // Overlap check: new slot must not intersect with any existing slot on the same day
        var hasOverlap = await db.Set<AvailabilityModel>()
            .AnyAsync(a => a.DoctorId   == doctor.Id
                        && a.DayOfWeek  == request.DayOfWeek
                        && a.StartTime  < endTime
                        && a.EndTime    > startTime, ct);

        if (hasOverlap)
            throw new ConflictException("This availability slot overlaps with an existing slot for the same day.");

        var slot = new AvailabilityModel
        {
            DoctorId            = doctor.Id,
            DayOfWeek           = request.DayOfWeek,
            StartTime           = startTime,
            EndTime             = endTime,
            SlotDurationMinutes = request.SlotDurationMinutes,
            IsAvailable         = true,
            CreatedAt           = DateTime.UtcNow
        };

        db.Set<AvailabilityModel>().Add(slot);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Availability slot added. DoctorId={DoctorId} Day={Day} Time={Start}-{End}",
            doctor.Id, request.DayOfWeek, startTime, endTime);

        return MapToAvailabilityResponse(slot);
    }

    // ════════════════════════════════════════════════════════════════════════
    // GET MY AVAILABILITY
    // ════════════════════════════════════════════════════════════════════════

    public async Task<IReadOnlyList<AvailabilityResponse>> GetMyAvailabilityAsync(
        Guid userId,
        CancellationToken ct = default)
    {
        var doctor = await FetchDoctorByUserIdAsync(userId, ct);

        var slots = await db.Set<AvailabilityModel>()
            .Where(a => a.DoctorId == doctor.Id)
            .OrderBy(a => a.DayOfWeek)
            .ThenBy(a => a.StartTime)
            .ToListAsync(ct);

        return slots.ConvertAll(MapToAvailabilityResponse);
    }

    // ════════════════════════════════════════════════════════════════════════
    // UPDATE AVAILABILITY SLOT
    // ════════════════════════════════════════════════════════════════════════

    public async Task<AvailabilityResponse> UpdateAvailabilityAsync(
        Guid userId,
        Guid slotId,
        UpdateAvailabilityRequest request,
        CancellationToken ct = default)
    {
        var doctor = await FetchDoctorByUserIdAsync(userId, ct);

        var slot = await db.Set<AvailabilityModel>()
            .FirstOrDefaultAsync(a => a.Id == slotId, ct)
            ?? throw NotFoundException.For("Availability slot", slotId);

        // Ownership gate — doctor cannot modify another doctor's slot
        if (slot.DoctorId != doctor.Id)
        {
            logger.LogWarning("Forbidden: UserId={UserId} attempted to modify slot {SlotId} owned by another doctor", userId, slotId);
            throw new ForbiddenException("You are not authorized to modify this availability slot.");
        }

        // Determine effective times after the update
        var effectiveStart = request.StartTime is not null
            ? TimeOnly.Parse(request.StartTime)
            : slot.StartTime;

        var effectiveEnd = request.EndTime is not null
            ? TimeOnly.Parse(request.EndTime)
            : slot.EndTime;

        // Validate time range if either end is changing
        if (request.StartTime is not null || request.EndTime is not null)
        {
            if (effectiveStart >= effectiveEnd)
                throw DomainValidationException.For("TimeRange", "Start time must be before end time.");

            // Overlap check — exclude the current slot from comparison
            var hasOverlap = await db.Set<AvailabilityModel>()
                .AnyAsync(a => a.DoctorId  == doctor.Id
                            && a.DayOfWeek == slot.DayOfWeek
                            && a.Id        != slotId
                            && a.StartTime < effectiveEnd
                            && a.EndTime   > effectiveStart, ct);

            if (hasOverlap)
                throw new ConflictException("Updated time range overlaps with an existing slot for the same day.");
        }

        // Validate slot duration fits in the effective window
        var effectiveDuration = request.SlotDurationMinutes ?? slot.SlotDurationMinutes;
        var windowMinutes     = (int)(effectiveEnd - effectiveStart).TotalMinutes;

        if (effectiveDuration > windowMinutes)
            throw DomainValidationException.For(
                "SlotDurationMinutes",
                "Slot duration must not exceed the total availability window.");

        // Apply updates
        slot.StartTime           = effectiveStart;
        slot.EndTime             = effectiveEnd;
        slot.SlotDurationMinutes = effectiveDuration;
        if (request.IsAvailable.HasValue) slot.IsAvailable = request.IsAvailable.Value;

        await db.SaveChangesAsync(ct);
        return MapToAvailabilityResponse(slot);
    }

    // ════════════════════════════════════════════════════════════════════════
    // DELETE AVAILABILITY SLOT
    // ════════════════════════════════════════════════════════════════════════

    public async Task DeleteAvailabilityAsync(
        Guid userId,
        Guid slotId,
        CancellationToken ct = default)
    {
        var doctor = await FetchDoctorByUserIdAsync(userId, ct);

        var slot = await db.Set<AvailabilityModel>()
            .FirstOrDefaultAsync(a => a.Id == slotId, ct)
            ?? throw NotFoundException.For("Availability slot", slotId);

        if (slot.DoctorId != doctor.Id)
        {
            logger.LogWarning("Forbidden: UserId={UserId} attempted to delete slot {SlotId} owned by another doctor", userId, slotId);
            throw new ForbiddenException("You are not authorized to delete this availability slot.");
        }

        db.Set<AvailabilityModel>().Remove(slot);
        await db.SaveChangesAsync(ct);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PUBLIC DOCTOR LISTING
    // ════════════════════════════════════════════════════════════════════════

    public async Task<PaginatedResponse<DoctorPublicListItemResponse>> GetPublicDoctorsAsync(
        DoctorListQuery query,
        CancellationToken ct = default)
    {
        // Sanitize pagination bounds
        var page     = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 50);

        // Base join: only publicly visible, approved doctors
        var baseQuery =
            from d in db.Set<DoctorModel>()
            join u in db.Set<User>() on d.UserId equals u.Id
            where d.IsPubliclyVisible && d.ApprovalStatus == ApprovalStatus.Approved
            select new { Doctor = d, User = u };

        // Optional filters (case-insensitive)
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
            .Select(x => new DoctorPublicListItemResponse(
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

        return PaginatedResponse<DoctorPublicListItemResponse>.Create(items, totalCount, page, pageSize);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PUBLIC DOCTOR DETAIL
    // ════════════════════════════════════════════════════════════════════════

    public async Task<DoctorPublicDetailResponse> GetPublicDoctorDetailAsync(
        Guid doctorId,
        CancellationToken ct = default)
    {
        var result = await (
            from d in db.Set<DoctorModel>()
            join u in db.Set<User>() on d.UserId equals u.Id
            where d.Id == doctorId && d.IsPubliclyVisible
            select new { Doctor = d, User = u })
            .FirstOrDefaultAsync(ct);

        if (result is null)
            throw new NotFoundException("Doctor not found or is not publicly available.");

        // Load only active (visible) slots for public display
        var availability = await db.Set<AvailabilityModel>()
            .Where(a => a.DoctorId == doctorId && a.IsAvailable)
            .OrderBy(a => a.DayOfWeek)
            .ThenBy(a => a.StartTime)
            .Select(a => new AvailabilityPublicSlotResponse(
                a.DayOfWeek,
                a.StartTime.ToString("HH:mm"),
                a.EndTime.ToString("HH:mm"),
                a.SlotDurationMinutes))
            .ToListAsync(ct);

        return new DoctorPublicDetailResponse(
            result.Doctor.Id,
            result.User.FullName,
            result.Doctor.Specialization,
            result.Doctor.Qualification,
            result.Doctor.ExperienceYears,
            result.Doctor.Bio,
            result.Doctor.ConsultationFee,
            result.Doctor.HospitalName,
            result.Doctor.City,
            result.Doctor.State,
            result.Doctor.Country,
            result.Doctor.LanguagesSpoken ?? [],
            result.Doctor.Rating,
            result.Doctor.TotalReviews,
            result.Doctor.TotalConsultations,
            result.Doctor.ProfileImageUrl,
            availability);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ════════════════════════════════════════════════════════════════════════

    private async Task<(DoctorModel Doctor, User User)> FetchDoctorWithUserAsync(
        Guid userId, CancellationToken ct)
    {
        var user = await db.Set<User>()
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, ct)
            ?? throw new NotFoundException("User account not found or inactive.");

        var doctor = await db.Set<DoctorModel>()
            .FirstOrDefaultAsync(d => d.UserId == userId, ct)
            ?? throw new NotFoundException("Doctor profile not found. Please complete your profile setup.");

        return (doctor, user);
    }

    private async Task<DoctorModel> FetchDoctorByUserIdAsync(Guid userId, CancellationToken ct) =>
        await db.Set<DoctorModel>()
            .FirstOrDefaultAsync(d => d.UserId == userId, ct)
        ?? throw new NotFoundException("Doctor profile not found. Please create your profile first.");

    /// <summary>
    /// A profile is considered complete when all six mandatory fields are present.
    /// Mirrors the SDD definition: Specialization, Qualification, ExperienceYears,
    /// LicenseNumber, ConsultationFee, City.
    /// </summary>
    private static bool EvaluateProfileCompleted(DoctorModel d) =>
        !string.IsNullOrWhiteSpace(d.Specialization)
        && !string.IsNullOrWhiteSpace(d.Qualification)
        && d.ExperienceYears.HasValue
        && !string.IsNullOrWhiteSpace(d.LicenseNumber)
        && d.ConsultationFee.HasValue
        && !string.IsNullOrWhiteSpace(d.City);

    private static DoctorProfileResponse BuildDoctorProfileResponse(DoctorModel d, User u) =>
        new(d.Id,
            d.UserId,
            u.FullName,
            u.Email ?? string.Empty,
            d.Specialization,
            d.Qualification,
            d.ExperienceYears,
            d.LicenseNumber,
            d.Bio,
            d.ProfileImageUrl,
            d.ConsultationFee,
            d.HospitalName,
            d.ClinicAddress,
            d.City,
            d.State,
            d.Country,
            d.LanguagesSpoken ?? [],
            d.ApprovalStatus.ToString(),
            d.Rating,
            d.TotalReviews,
            d.TotalConsultations,
            d.IsProfileCompleted,
            d.IsPubliclyVisible,
            d.CreatedAt,
            d.UpdatedAt);

    private static AvailabilityResponse MapToAvailabilityResponse(AvailabilityModel a) =>
        new(a.Id,
            a.DayOfWeek,
            a.StartTime.ToString("HH:mm"),
            a.EndTime.ToString("HH:mm"),
            a.SlotDurationMinutes,
            a.IsAvailable,
            a.CreatedAt);

    private static List<string>? NormalizeLanguages(List<string>? input) =>
        input?.Where(l => !string.IsNullOrWhiteSpace(l))
              .Select(l => l.Trim())
              .ToList();

    /// <summary>
    /// Returns lowercase, trimmed version for storing in _Normalized columns.
    /// Used for index-accelerated case-insensitive filtering in discovery queries.
    /// </summary>
    private static string? NormalizeSearchText(string? input) =>
        string.IsNullOrWhiteSpace(input) ? null : input.Trim().ToLowerInvariant();
}

