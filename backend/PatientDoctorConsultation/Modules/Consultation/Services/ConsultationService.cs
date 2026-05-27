using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PatientDoctorConsultation.Infrastructure.Realtime.LiveKit;
using PatientDoctorConsultation.Infrastructure.Realtime.SignalR;
using PatientDoctorConsultation.Infrastructure.Persistence.Context;
using PatientDoctorConsultation.Modules.Auth.Models;
using PatientDoctorConsultation.Modules.Consultation.DTOs;
using PatientDoctorConsultation.Modules.Consultation.Enums;
using PatientDoctorConsultation.Modules.Consultation.Interfaces;
using PatientDoctorConsultation.Modules.Consultation.Models;
using PatientDoctorConsultation.Shared.Config;
using PatientDoctorConsultation.Shared.Constants;
using PatientDoctorConsultation.Shared.Enums;
using PatientDoctorConsultation.Shared.Exceptions;
using PatientDoctorConsultation.Shared.Responses;
using DoctorModel = PatientDoctorConsultation.Modules.Doctor.Models.Doctor;
using PatientModel = PatientDoctorConsultation.Modules.Patient.Models.Patient;
using ConsultationModel = PatientDoctorConsultation.Modules.Consultation.Models.Consultation;

namespace PatientDoctorConsultation.Modules.Consultation.Services;

public sealed class ConsultationService(
    ApplicationDbContext db,
    ILogger<ConsultationService> logger,
    ILiveKitService liveKitService,
    ISignalRNotificationService notificationService,
    IOptions<LiveKitConfig> liveKitConfig) : IConsultationService
{
    private readonly LiveKitConfig _liveKitConfig = liveKitConfig.Value;

    // ════════════════════════════════════════════════════════════════════════
    // PATIENT — BOOK CONSULTATION
    // ════════════════════════════════════════════════════════════════════════

    public async Task<ConsultationDetailsResponse> BookConsultationAsync(
        Guid userId,
        BookConsultationRequest request,
        CancellationToken ct = default)
    {
        // 1. Resolve patient profile
        var patient = await db.Set<PatientModel>()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct)
            ?? throw new NotFoundException("Patient profile not found. Complete your profile before booking.");

        // 1a. Verify the patient's account is still active (admin may have blocked it after JWT was issued)
        var patientUser = await db.Set<User>()
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (patientUser is not null && !patientUser.IsActive)
        {
            logger.LogWarning(
                "[Booking Blocked] Patient account is blocked. UserId={UserId} DoctorId={DoctorId}",
                userId, request.DoctorId);
            throw new ForbiddenException("Your account has been suspended. Please contact support.");
        }

        // 2. Resolve target doctor
        var doctor = await db.Set<DoctorModel>()
            .FirstOrDefaultAsync(d => d.Id == request.DoctorId && d.DeletedAt == null, ct)
            ?? throw new NotFoundException($"Doctor with id '{request.DoctorId}' was not found.");

        // 3. Doctor must be approved and publicly visible (SDD Rule 1)
        //    This guard enforces admin moderation — suspended, rejected, or hidden doctors
        //    are completely blocked from receiving new bookings.
        //    Returns 409 Conflict because the doctor's business state conflicts with the booking.
        if (!IsDoctorAvailableForBooking(doctor))
        {
            logger.LogWarning(
                "[Booking Blocked] Patient attempted booking with unavailable doctor. " +
                "PatientId={PatientId} DoctorId={DoctorId} DoctorStatus={ApprovalStatus} IsPubliclyVisible={IsPubliclyVisible}",
                patient.Id, doctor.Id, doctor.ApprovalStatus, doctor.IsPubliclyVisible);

            throw new ConflictException("This doctor is not currently available for booking.");
        }

        // 4. ConsultationFee must be set
        if (doctor.ConsultationFee is null or <= 0)
            throw DomainValidationException.For(
                "DoctorId",
                "This doctor has not set a consultation fee and cannot be booked at this time.");

        // 5. Parse time values
        var startTime = TimeOnly.Parse(request.StartTime);
        var endTime   = TimeOnly.Parse(request.EndTime);

        // 6. Cannot book past date/time (SDD Rule 3)
        var scheduledUtc = request.ScheduledDate.ToDateTime(startTime, DateTimeKind.Utc);
        if (scheduledUtc <= DateTime.UtcNow)
            throw DomainValidationException.For(
                "ScheduledDate",
                "Scheduled date and time must be in the future.");

        // 7. Duplicate booking check — same patient + doctor + date + time in Pending/Confirmed (SDD Rule 2)
        var duplicateExists = await db.Set<ConsultationModel>()
            .AnyAsync(c => c.PatientId == patient.Id
                        && c.DoctorId == request.DoctorId
                        && c.ScheduledDate == request.ScheduledDate
                        && c.StartTime == startTime
                        && (c.Status == ConsultationStatus.Pending || c.Status == ConsultationStatus.Confirmed), ct);

        if (duplicateExists)
        {
            logger.LogWarning("Duplicate booking blocked. PatientId={PatientId} DoctorId={DoctorId} Date={Date} StartTime={Start}",
                patient.Id, request.DoctorId, request.ScheduledDate, startTime);
            throw new ConflictException("A pending or confirmed booking with this doctor already exists for the same date and time.");
        }

        // 8. Slot conflict check for doctor — no other booking at same slot
        var slotConflict = await db.Set<ConsultationModel>()
            .AnyAsync(c => c.DoctorId == request.DoctorId
                        && c.ScheduledDate == request.ScheduledDate
                        && c.StartTime < endTime
                        && c.EndTime > startTime
                        && (c.Status == ConsultationStatus.Pending || c.Status == ConsultationStatus.Confirmed), ct);

        if (slotConflict)
        {
            logger.LogWarning("Slot conflict blocked. DoctorId={DoctorId} Date={Date} Start={Start} End={End}",
                request.DoctorId, request.ScheduledDate, startTime, endTime);
            throw new ConflictException("This time slot is no longer available. The doctor has a conflicting booking.");
        }

        // 9. Validate AvailabilityId if provided
        if (request.AvailabilityId.HasValue)
        {
            var slotExists = await db.Set<PatientDoctorConsultation.Modules.Doctor.Models.DoctorAvailability>()
                .AnyAsync(a => a.Id == request.AvailabilityId.Value && a.DoctorId == request.DoctorId && a.IsAvailable, ct);

            if (!slotExists)
                throw DomainValidationException.For(
                    "AvailabilityId",
                    "The specified availability slot does not exist or is unavailable.");
        }

        // 10. Validate follow-up chain (SDD Rule: parent must be Completed + same DoctorId)
        if (request.IsFollowUp && request.ParentConsultationId.HasValue)
        {
            var parent = await db.Set<ConsultationModel>()
                .FirstOrDefaultAsync(c => c.Id == request.ParentConsultationId.Value, ct)
                ?? throw new NotFoundException($"Parent consultation '{request.ParentConsultationId}' was not found.");

            if (parent.Status != ConsultationStatus.Completed)
                throw DomainValidationException.For("ParentConsultationId", "Parent consultation must be Completed before booking a follow-up.");

            if (parent.DoctorId != request.DoctorId)
                throw DomainValidationException.For("ParentConsultationId", "Follow-up must be booked with the same doctor as the parent consultation.");
        }

        // 11. Parse ConsultationType enum
        if (!Enum.TryParse<ConsultationType>(request.ConsultationType, true, out var consultationType))
            throw DomainValidationException.For("ConsultationType", "Invalid ConsultationType value.");

        // 12. Build entity
        var consultation = new ConsultationModel
        {
            PatientId               = patient.Id,
            DoctorId                = request.DoctorId,
            AvailabilityId          = request.AvailabilityId,
            ConsultationNumber      = await GenerateConsultationNumberAsync(ct),
            ScheduledDate           = request.ScheduledDate,
            StartTime               = startTime,
            EndTime                 = endTime,
            TimeZone                = request.TimeZone.Trim(),
            Status                  = ConsultationStatus.Pending,
            ConsultationType        = consultationType,
            Symptoms                = request.Symptoms.Trim(),
            ConsultationFeeSnapshot = doctor.ConsultationFee!.Value, // snapshotted immutably
            IsFollowUp              = request.IsFollowUp,
            ParentConsultationId    = request.IsFollowUp ? request.ParentConsultationId : null,
            CreatedAt               = DateTime.UtcNow
        };

        db.Set<ConsultationModel>().Add(consultation);

        // 13. Create initial status history: NULL → Pending
        await RecordStatusTransitionAsync(consultation.Id, null, ConsultationStatus.Pending, userId, null, ct, skipSave: true);

        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "Consultation booked. ConsultationNumber={ConsultationNumber} PatientId={PatientId} DoctorId={DoctorId} Type={Type} Date={Date}",
            consultation.ConsultationNumber, patient.Id, request.DoctorId, consultationType, request.ScheduledDate);

        await NotifyStatusChangeAsync(consultation, ConsultationStatus.Pending.ToString(), ct);

        return await FetchDetailsResponseAsync(consultation.Id, ct);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PATIENT — GET MY CONSULTATIONS
    // ════════════════════════════════════════════════════════════════════════

    public async Task<PaginatedResponse<ConsultationSummaryResponse>> GetMyConsultationsAsync(
        Guid userId,
        ConsultationListQuery query,
        CancellationToken ct = default)
    {
        var patient = await db.Set<PatientModel>()
            .FirstOrDefaultAsync(p => p.UserId == userId, ct)
            ?? throw new NotFoundException("Patient profile not found.");

        var baseQuery = BuildSummaryQuery()
            .Where(x => x.c.PatientId == patient.Id);

        if (!string.IsNullOrWhiteSpace(query.Status) &&
            Enum.TryParse<ConsultationStatus>(query.Status, true, out var statusFilter))
        {
            baseQuery = baseQuery.Where(x => x.c.Status == statusFilter);
        }

        var totalCount = await baseQuery.CountAsync(ct);
        var page       = Math.Max(1, query.Page);
        var pageSize   = Math.Clamp(query.PageSize, 1, 50);

        var items = await baseQuery
            .OrderByDescending(x => x.c.ScheduledDate)
            .ThenByDescending(x => x.c.StartTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => MapToSummaryResponse(x))
            .ToListAsync(ct);

        return PaginatedResponse<ConsultationSummaryResponse>.Create(items, totalCount, page, pageSize);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PATIENT — CANCEL CONSULTATION
    // ════════════════════════════════════════════════════════════════════════

    public async Task<ConsultationDetailsResponse> CancelConsultationAsync(
        Guid userId,
        string userRole,
        Guid consultationId,
        CancelConsultationRequest request,
        CancellationToken ct = default)
    {
        var consultation = await FetchConsultationAsync(consultationId, ct);

        // Access control — patient can only cancel own, doctor only assigned
        EnforceAccessControl(consultation, userId, userRole);

        // Status validation — can only cancel Pending or Confirmed (SDD Rule 4)
        if (consultation.Status != ConsultationStatus.Pending &&
            consultation.Status != ConsultationStatus.Confirmed)
        {
            throw new ConflictException(
                $"Consultation in '{consultation.Status}' state cannot be cancelled. Only Pending or Confirmed consultations can be cancelled.");
        }

        var cancelledBy = userRole switch
        {
            Roles.Patient => CancelledBy.Patient,
            Roles.Doctor  => CancelledBy.Doctor,
            Roles.Admin   => CancelledBy.Admin,
            _             => CancelledBy.Admin
        };

        var oldStatus = consultation.Status;
        consultation.Status             = ConsultationStatus.Cancelled;
        consultation.CancellationReason = request.Reason.Trim();
        consultation.CancelledBy        = cancelledBy;
        consultation.UpdatedAt          = DateTime.UtcNow;

        await RecordStatusTransitionAsync(consultation.Id, oldStatus, ConsultationStatus.Cancelled, userId, request.Reason.Trim(), ct, skipSave: true);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Consultation cancelled. ConsultationId={ConsultationId} CancelledBy={CancelledBy}",
            consultationId, cancelledBy);

        await NotifyStatusChangeAsync(consultation, ConsultationStatus.Cancelled.ToString(), ct);

        return await FetchDetailsResponseAsync(consultation.Id, ct);
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR — GET CONSULTATION REQUESTS (Pending)
    // ════════════════════════════════════════════════════════════════════════

    public async Task<PaginatedResponse<ConsultationSummaryResponse>> GetConsultationRequestsAsync(
        Guid userId,
        ConsultationListQuery query,
        CancellationToken ct = default)
    {
        var doctor = await FetchDoctorByUserIdAsync(userId, ct);

        var baseQuery = BuildSummaryQuery()
            .Where(x => x.c.DoctorId == doctor.Id && x.c.Status == ConsultationStatus.Pending);

        var totalCount = await baseQuery.CountAsync(ct);
        var page       = Math.Max(1, query.Page);
        var pageSize   = Math.Clamp(query.PageSize, 1, 50);

        var items = await baseQuery
            .OrderBy(x => x.c.ScheduledDate)
            .ThenBy(x => x.c.StartTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => MapToSummaryResponse(x))
            .ToListAsync(ct);

        return PaginatedResponse<ConsultationSummaryResponse>.Create(items, totalCount, page, pageSize);
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR — CONFIRM CONSULTATION
    // ════════════════════════════════════════════════════════════════════════

    public async Task<ConsultationDetailsResponse> ConfirmConsultationAsync(
        Guid userId,
        Guid consultationId,
        CancellationToken ct = default)
    {
        var (consultation, doctor) = await FetchConsultationForDoctorAsync(consultationId, userId, ct);

        if (consultation.Status != ConsultationStatus.Pending)
            throw new ConflictException($"Only Pending consultations can be confirmed. Current status: {consultation.Status}.");

        var oldStatus = consultation.Status;
        consultation.Status    = ConsultationStatus.Confirmed;
        consultation.UpdatedAt = DateTime.UtcNow;

        // For Video type: generate meeting room details (stub — real integration is future scope)
        if (consultation.ConsultationType == ConsultationType.Video)
        {
            consultation.MeetingRoomId = Guid.NewGuid().ToString("N")[..12];
            consultation.MeetingLink   = $"https://meet.example.com/rooms/{consultation.MeetingRoomId}";
        }

        await RecordStatusTransitionAsync(consultation.Id, oldStatus, ConsultationStatus.Confirmed, userId, null, ct, skipSave: true);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Consultation confirmed. ConsultationId={ConsultationId} DoctorId={DoctorId}",
            consultationId, doctor.Id);

        await NotifyStatusChangeAsync(consultation, ConsultationStatus.Confirmed.ToString(), ct);

        return await FetchDetailsResponseAsync(consultation.Id, ct);
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR — REJECT CONSULTATION
    // ════════════════════════════════════════════════════════════════════════

    public async Task<ConsultationDetailsResponse> RejectConsultationAsync(
        Guid userId,
        Guid consultationId,
        RejectConsultationRequest request,
        CancellationToken ct = default)
    {
        var (consultation, _) = await FetchConsultationForDoctorAsync(consultationId, userId, ct);

        if (consultation.Status != ConsultationStatus.Pending)
            throw new ConflictException($"Only Pending consultations can be rejected. Current status: {consultation.Status}.");

        var oldStatus = consultation.Status;
        consultation.Status    = ConsultationStatus.Rejected;
        consultation.UpdatedAt = DateTime.UtcNow;

        await RecordStatusTransitionAsync(consultation.Id, oldStatus, ConsultationStatus.Rejected, userId, request.Reason.Trim(), ct, skipSave: true);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Consultation rejected. ConsultationId={ConsultationId}", consultationId);

        await NotifyStatusChangeAsync(consultation, ConsultationStatus.Rejected.ToString(), ct);

        return await FetchDetailsResponseAsync(consultation.Id, ct);
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR — GET SCHEDULE (Confirmed + InProgress)
    // ════════════════════════════════════════════════════════════════════════

    public async Task<PaginatedResponse<ConsultationSummaryResponse>> GetDoctorScheduleAsync(
        Guid userId,
        DoctorScheduleQuery query,
        CancellationToken ct = default)
    {
        var doctor = await FetchDoctorByUserIdAsync(userId, ct);

        var baseQuery = BuildSummaryQuery()
            .Where(x => x.c.DoctorId == doctor.Id
                     && (x.c.Status == ConsultationStatus.Confirmed || x.c.Status == ConsultationStatus.InProgress));

        if (query.Date.HasValue)
            baseQuery = baseQuery.Where(x => x.c.ScheduledDate == query.Date.Value);

        var totalCount = await baseQuery.CountAsync(ct);
        var page       = Math.Max(1, query.Page);
        var pageSize   = Math.Clamp(query.PageSize, 1, 50);

        var items = await baseQuery
            .OrderBy(x => x.c.ScheduledDate)
            .ThenBy(x => x.c.StartTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => MapToSummaryResponse(x))
            .ToListAsync(ct);

        return PaginatedResponse<ConsultationSummaryResponse>.Create(items, totalCount, page, pageSize);
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR — MARK IN PROGRESS
    // ════════════════════════════════════════════════════════════════════════

    public async Task<ConsultationDetailsResponse> MarkInProgressAsync(
        Guid userId,
        Guid consultationId,
        CancellationToken ct = default)
    {
        var (consultation, _) = await FetchConsultationForDoctorAsync(consultationId, userId, ct);

        if (consultation.Status != ConsultationStatus.Confirmed)
            throw new ConflictException($"Only Confirmed consultations can be started. Current status: {consultation.Status}.");

        var oldStatus = consultation.Status;
        consultation.Status    = ConsultationStatus.InProgress;
        consultation.UpdatedAt = DateTime.UtcNow;

        if (consultation.ConsultationType == ConsultationType.Video)
            consultation.MeetingStartedAt = DateTime.UtcNow;

        await RecordStatusTransitionAsync(consultation.Id, oldStatus, ConsultationStatus.InProgress, userId, null, ct, skipSave: true);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Consultation started (InProgress). ConsultationId={ConsultationId}", consultationId);

        await NotifyStatusChangeAsync(consultation, ConsultationStatus.InProgress.ToString(), ct);

        return await FetchDetailsResponseAsync(consultation.Id, ct);
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR — MARK COMPLETED
    // ════════════════════════════════════════════════════════════════════════

    public async Task<ConsultationDetailsResponse> MarkCompletedAsync(
        Guid userId,
        Guid consultationId,
        CompleteConsultationRequest request,
        CancellationToken ct = default)
    {
        var (consultation, doctor) = await FetchConsultationForDoctorAsync(consultationId, userId, ct);

        if (consultation.Status != ConsultationStatus.InProgress)
            throw new ConflictException($"Only InProgress consultations can be completed. Current status: {consultation.Status}.");

        var oldStatus = consultation.Status;
        consultation.Status    = ConsultationStatus.Completed;
        consultation.Notes     = request.Notes?.Trim();
        consultation.UpdatedAt = DateTime.UtcNow;

        if (consultation.ConsultationType == ConsultationType.Video)
            consultation.MeetingEndedAt = DateTime.UtcNow;

        await RecordStatusTransitionAsync(consultation.Id, oldStatus, ConsultationStatus.Completed, userId, null, ct, skipSave: true);

        // Increment doctor's total consultations counter (cross-module write — SDD README §9)
        doctor.TotalConsultations += 1;
        doctor.UpdatedAt           = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        logger.LogInformation("Consultation completed. ConsultationId={ConsultationId} DoctorId={DoctorId} TotalConsultations={Total}",
            consultationId, doctor.Id, doctor.TotalConsultations);

        await NotifyStatusChangeAsync(consultation, ConsultationStatus.Completed.ToString(), ct);

        return await FetchDetailsResponseAsync(consultation.Id, ct);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHARED — GET CONSULTATION BY ID
    // ════════════════════════════════════════════════════════════════════════

    public async Task<ConsultationDetailsResponse> GetConsultationByIdAsync(
        Guid userId,
        string userRole,
        Guid consultationId,
        CancellationToken ct = default)
    {
        var consultation = await FetchConsultationAsync(consultationId, ct);
        EnforceAccessControl(consultation, userId, userRole);
        return await FetchDetailsResponseAsync(consultation.Id, ct);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHARED — GET STATUS HISTORY
    // ════════════════════════════════════════════════════════════════════════

    public async Task<IReadOnlyList<ConsultationStatusHistoryResponse>> GetStatusHistoryAsync(
        Guid userId,
        string userRole,
        Guid consultationId,
        CancellationToken ct = default)
    {
        var consultation = await FetchConsultationAsync(consultationId, ct);
        EnforceAccessControl(consultation, userId, userRole);

        var history = await (
            from h in db.Set<ConsultationStatusHistory>()
            join u in db.Set<User>() on h.ChangedByUserId equals u.Id into userJoin
            from u in userJoin.DefaultIfEmpty()
            where h.ConsultationId == consultationId
            orderby h.CreatedAt
            select new ConsultationStatusHistoryResponse(
                h.Id,
                h.ConsultationId,
                h.OldStatus == null ? null : h.OldStatus.ToString(),
                h.NewStatus.ToString(),
                h.ChangedByUserId,
                u != null ? u.FullName : "System",
                h.Reason,
                h.CreatedAt
            )
        ).ToListAsync(ct);

        return history;
    }

    public async Task<ConsultationVideoTokenResponse> GenerateVideoTokenAsync(
        Guid userId,
        string userRole,
        Guid consultationId,
        CancellationToken ct = default)
    {
        var consultation = await FetchConsultationAsync(consultationId, ct);
        EnforceAccessControl(consultation, userId, userRole);

        if (consultation.ConsultationType != ConsultationType.Video)
            throw new ConflictException("This consultation is not a video session.");

        if (consultation.Status is not (ConsultationStatus.Confirmed or ConsultationStatus.InProgress))
            throw new ConflictException("Video join is allowed only for Confirmed or InProgress consultations.");

        if (string.IsNullOrWhiteSpace(consultation.MeetingRoomId))
            throw new ConflictException("Meeting room is not provisioned for this consultation yet.");

        var user = await db.Set<User>().FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("User not found.");

        var participantIdentity = $"{userRole.ToLowerInvariant()}-{userId:N}";
        var accessToken = liveKitService.GenerateAccessToken(
            consultation.MeetingRoomId,
            participantIdentity,
            user.FullName);

        return new ConsultationVideoTokenResponse(
            ConsultationId: consultation.Id,
            MeetingRoomId: consultation.MeetingRoomId,
            AccessToken: accessToken,
            LiveKitUrl: _liveKitConfig.Host,
            ParticipantIdentity: participantIdentity,
            ExpiresAt: DateTime.UtcNow.AddHours(2));
    }

    // ════════════════════════════════════════════════════════════════════════
    // ADMIN — GET ALL CONSULTATIONS
    // ════════════════════════════════════════════════════════════════════════

    public async Task<PaginatedResponse<ConsultationSummaryResponse>> GetAllConsultationsAsync(
        AdminConsultationQuery query,
        CancellationToken ct = default)
    {
        var baseQuery = BuildSummaryQuery();

        if (!string.IsNullOrWhiteSpace(query.Status) &&
            Enum.TryParse<ConsultationStatus>(query.Status, true, out var statusFilter))
            baseQuery = baseQuery.Where(x => x.c.Status == statusFilter);

        if (query.DoctorId.HasValue)
            baseQuery = baseQuery.Where(x => x.c.DoctorId == query.DoctorId.Value);

        if (query.PatientId.HasValue)
            baseQuery = baseQuery.Where(x => x.c.PatientId == query.PatientId.Value);

        if (query.DateFrom.HasValue)
            baseQuery = baseQuery.Where(x => x.c.ScheduledDate >= query.DateFrom.Value);

        if (query.DateTo.HasValue)
            baseQuery = baseQuery.Where(x => x.c.ScheduledDate <= query.DateTo.Value);

        if (!string.IsNullOrWhiteSpace(query.ConsultationType) &&
            Enum.TryParse<ConsultationType>(query.ConsultationType, true, out var typeFilter))
            baseQuery = baseQuery.Where(x => x.c.ConsultationType == typeFilter);

        var totalCount = await baseQuery.CountAsync(ct);
        var page       = Math.Max(1, query.Page);
        var pageSize   = Math.Clamp(query.PageSize, 1, 100);

        var items = await baseQuery
            .OrderByDescending(x => x.c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => MapToSummaryResponse(x))
            .ToListAsync(ct);

        return PaginatedResponse<ConsultationSummaryResponse>.Create(items, totalCount, page, pageSize);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PRIVATE — QUERY HELPERS
    // ════════════════════════════════════════════════════════════════════════

    private IQueryable<ConsultationJoinResult> BuildSummaryQuery()
    {
        return from c in db.Set<ConsultationModel>()
               join d  in db.Set<DoctorModel>() on c.DoctorId equals d.Id
               join du in db.Set<User>() on d.UserId equals du.Id
               join p  in db.Set<PatientModel>() on c.PatientId equals p.Id
               join pu in db.Set<User>() on p.UserId equals pu.Id
               select new ConsultationJoinResult
               {
                   c                   = c,
                   DoctorName          = du.FullName,
                   DoctorSpecialization = d.Specialization,
                   DoctorProfileImageUrl = d.ProfileImageUrl,
                   PatientName         = pu.FullName
               };
    }

    private async Task<ConsultationDetailsResponse> FetchDetailsResponseAsync(Guid consultationId, CancellationToken ct)
    {
        var result = await (
            from c in db.Set<ConsultationModel>()
            join d  in db.Set<DoctorModel>() on c.DoctorId equals d.Id
            join du in db.Set<User>() on d.UserId equals du.Id
            join p  in db.Set<PatientModel>() on c.PatientId equals p.Id
            join pu in db.Set<User>() on p.UserId equals pu.Id
            where c.Id == consultationId
            select new ConsultationDetailsResponse(
                c.Id,
                c.ConsultationNumber,
                c.Status.ToString(),
                c.ConsultationType.ToString(),
                c.ScheduledDate,
                c.StartTime.ToString("HH:mm:ss"),
                c.EndTime.ToString("HH:mm:ss"),
                c.TimeZone,
                c.DoctorId,
                du.FullName,
                d.Specialization,
                d.ProfileImageUrl,
                c.PatientId,
                pu.FullName,
                c.Symptoms,
                c.Notes,
                c.CancellationReason,
                c.CancelledBy == null ? null : c.CancelledBy.ToString(),
                c.MeetingRoomId,
                c.MeetingLink,
                c.MeetingStartedAt,
                c.MeetingEndedAt,
                c.ConsultationFeeSnapshot,
                c.IsFollowUp,
                c.ParentConsultationId,
                c.CreatedAt,
                c.UpdatedAt
            )
        ).FirstOrDefaultAsync(ct)
          ?? throw new NotFoundException($"Consultation '{consultationId}' was not found.");

        return result;
    }

    // ════════════════════════════════════════════════════════════════════════
    // PRIVATE — ENTITY FETCHERS
    // ════════════════════════════════════════════════════════════════════════

    private async Task<ConsultationModel> FetchConsultationAsync(Guid consultationId, CancellationToken ct)
        => await db.Set<ConsultationModel>()
               .FirstOrDefaultAsync(c => c.Id == consultationId, ct)
           ?? throw new NotFoundException($"Consultation with id '{consultationId}' was not found.");

    private async Task<DoctorModel> FetchDoctorByUserIdAsync(Guid userId, CancellationToken ct)
        => await db.Set<DoctorModel>()
               .FirstOrDefaultAsync(d => d.UserId == userId && d.DeletedAt == null, ct)
           ?? throw new NotFoundException("Doctor profile not found.");

    private async Task<(ConsultationModel Consultation, DoctorModel Doctor)> FetchConsultationForDoctorAsync(
        Guid consultationId,
        Guid userId,
        CancellationToken ct)
    {
        var doctor = await FetchDoctorByUserIdAsync(userId, ct);

        var consultation = await db.Set<ConsultationModel>()
            .FirstOrDefaultAsync(c => c.Id == consultationId, ct)
            ?? throw new NotFoundException($"Consultation with id '{consultationId}' was not found.");

        if (consultation.DoctorId != doctor.Id)
        {
            logger.LogWarning("Forbidden: UserId={UserId} attempted to manage Consultation {ConsultationId} owned by another doctor",
                userId, consultationId);
            throw new ForbiddenException("You are not authorized to manage this consultation.");
        }

        return (consultation, doctor);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PRIVATE — ACCESS CONTROL
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Central booking eligibility check for a doctor.
    /// A doctor is bookable only when:
    ///   • ApprovalStatus == Approved (admin has approved the account)
    ///   • IsPubliclyVisible == true  (admin has not hidden / suspended the profile)
    ///   • DeletedAt == null          (profile has not been soft-deleted)
    ///
    /// Admin suspension sets ApprovalStatus = Suspended AND IsPubliclyVisible = false,
    /// so either condition alone would block the booking — both are checked for defense-in-depth.
    /// </summary>
    private static bool IsDoctorAvailableForBooking(DoctorModel doctor) =>
        doctor.DeletedAt == null
        && doctor.IsPubliclyVisible
        && doctor.ApprovalStatus == ApprovalStatus.Approved;

    private void EnforceAccessControl(ConsultationModel consultation, Guid userId, string userRole)
    {
        if (userRole == Roles.Admin) return; // Admin has full access

        if (userRole == Roles.Patient)
        {
            var patientId = db.Set<PatientModel>()
                .Where(p => p.UserId == userId)
                .Select(p => p.Id)
                .FirstOrDefault();

            if (consultation.PatientId != patientId)
            {
                logger.LogWarning("Forbidden: UserId={UserId} (Patient) attempted to access Consultation {ConsultationId}",
                    userId, consultation.Id);
                throw new ForbiddenException("You are not authorized to access this consultation.");
            }
        }
        else if (userRole == Roles.Doctor)
        {
            var doctorId = db.Set<DoctorModel>()
                .Where(d => d.UserId == userId && d.DeletedAt == null)
                .Select(d => d.Id)
                .FirstOrDefault();

            if (consultation.DoctorId != doctorId)
            {
                logger.LogWarning("Forbidden: UserId={UserId} (Doctor) attempted to access Consultation {ConsultationId}",
                    userId, consultation.Id);
                throw new ForbiddenException("You are not authorized to access this consultation.");
            }
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // PRIVATE — STATUS HISTORY
    // ════════════════════════════════════════════════════════════════════════

    private async Task RecordStatusTransitionAsync(
        Guid consultationId,
        ConsultationStatus? oldStatus,
        ConsultationStatus newStatus,
        Guid changedByUserId,
        string? reason,
        CancellationToken ct,
        bool skipSave = false)
    {
        var history = new ConsultationStatusHistory
        {
            ConsultationId  = consultationId,
            OldStatus       = oldStatus,
            NewStatus       = newStatus,
            ChangedByUserId = changedByUserId,
            Reason          = reason,
            CreatedAt       = DateTime.UtcNow
        };

        db.Set<ConsultationStatusHistory>().Add(history);

        if (!skipSave)
            await db.SaveChangesAsync(ct);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PRIVATE — CONSULTATION NUMBER GENERATION
    // ════════════════════════════════════════════════════════════════════════

    private async Task<string> GenerateConsultationNumberAsync(CancellationToken ct)
    {
        var year  = DateTime.UtcNow.Year;
        var count = await db.Set<ConsultationModel>()
            .IgnoreQueryFilters()
            .CountAsync(c => c.ScheduledDate.Year == year, ct);

        return $"CONS-{year}-{(count + 1):D6}";
    }

    // ════════════════════════════════════════════════════════════════════════
    // PRIVATE — RESPONSE MAPPERS
    // ════════════════════════════════════════════════════════════════════════

    private static ConsultationSummaryResponse MapToSummaryResponse(ConsultationJoinResult x)
        => new(
            x.c.Id,
            x.c.ConsultationNumber,
            x.c.Status.ToString(),
            x.c.ConsultationType.ToString(),
            x.c.ScheduledDate,
            x.c.StartTime.ToString("HH:mm:ss"),
            x.c.EndTime.ToString("HH:mm:ss"),
            x.c.DoctorId,
            x.DoctorName,
            x.DoctorSpecialization,
            x.DoctorProfileImageUrl,
            x.c.PatientId,
            x.PatientName,
            x.c.ConsultationFeeSnapshot,
            x.c.IsFollowUp,
            x.c.CreatedAt
        );

    // ════════════════════════════════════════════════════════════════════════
    // PRIVATE — HELPER TYPE FOR JOIN RESULTS
    // ════════════════════════════════════════════════════════════════════════

    private sealed class ConsultationJoinResult
    {
        public ConsultationModel c { get; init; } = null!;
        public string DoctorName { get; init; } = string.Empty;
        public string? DoctorSpecialization { get; init; }
        public string? DoctorProfileImageUrl { get; init; }
        public string PatientName { get; init; } = string.Empty;
    }

    // ════════════════════════════════════════════════════════════════════════
    // PRIVATE — REALTIME NOTIFICATION
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Push a ConsultationStatusChanged event to both the patient and doctor user
    /// via the NotificationHub. Best-effort — failures are logged but do not break the workflow.
    /// </summary>
    private async Task NotifyStatusChangeAsync(ConsultationModel consultation, string newStatus, CancellationToken ct)
    {
        try
        {
            // Resolve user IDs from profile IDs
            var patientUserId = await db.Set<PatientModel>()
                .Where(p => p.Id == consultation.PatientId)
                .Select(p => p.UserId)
                .FirstOrDefaultAsync(ct);

            var doctorUserId = await db.Set<DoctorModel>()
                .Where(d => d.Id == consultation.DoctorId)
                .Select(d => d.UserId)
                .FirstOrDefaultAsync(ct);

            var payload = new
            {
                consultationId = consultation.Id,
                status = newStatus,
                consultationNumber = consultation.ConsultationNumber,
                updatedAt = DateTime.UtcNow
            };

            if (patientUserId != Guid.Empty)
                await notificationService.SendToUserAsync(patientUserId.ToString(), "ConsultationStatusChanged", payload, ct);

            if (doctorUserId != Guid.Empty)
                await notificationService.SendToUserAsync(doctorUserId.ToString(), "ConsultationStatusChanged", payload, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send ConsultationStatusChanged notification for ConsultationId={ConsultationId}", consultation.Id);
        }
    }
}

