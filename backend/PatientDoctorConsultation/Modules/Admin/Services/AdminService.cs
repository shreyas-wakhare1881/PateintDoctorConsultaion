using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PatientDoctorConsultation.Infrastructure.Persistence.Context;
using PatientDoctorConsultation.Infrastructure.Realtime.SignalR;
using PatientDoctorConsultation.Modules.Admin.DTOs;
using PatientDoctorConsultation.Modules.Admin.Enums;
using PatientDoctorConsultation.Modules.Admin.Interfaces;
using PatientDoctorConsultation.Modules.Admin.Models;
using PatientDoctorConsultation.Modules.Auth.Models;
using PatientDoctorConsultation.Modules.Consultation.Models;
using PatientDoctorConsultation.Shared.Enums;
using PatientDoctorConsultation.Shared.Exceptions;
using PatientDoctorConsultation.Shared.Responses;
using DoctorModel = PatientDoctorConsultation.Modules.Doctor.Models.Doctor;
using PatientModel = PatientDoctorConsultation.Modules.Patient.Models.Patient;
using ConsultationModel = PatientDoctorConsultation.Modules.Consultation.Models.Consultation;

namespace PatientDoctorConsultation.Modules.Admin.Services;

public sealed class AdminService(
    ApplicationDbContext db,
    ILogger<AdminService> logger,
    ISignalRNotificationService notificationService) : IAdminService
{
    // ════════════════════════════════════════════════════════════════════════
    // DASHBOARD
    // ════════════════════════════════════════════════════════════════════════

    public async Task<AdminDashboardResponse> GetDashboardAsync(CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;

        var totalDoctors           = await db.Set<DoctorModel>().CountAsync(d => d.DeletedAt == null, ct);
        var pendingDoctors         = await db.Set<DoctorModel>().CountAsync(d => d.DeletedAt == null && d.ApprovalStatus == ApprovalStatus.Pending, ct);
        var suspendedDoctors       = await db.Set<DoctorModel>().CountAsync(d => d.DeletedAt == null && d.ApprovalStatus == ApprovalStatus.Suspended, ct);
        var totalActivePatients    = await db.Set<User>().CountAsync(u => u.Role == UserRole.Patient && u.IsActive, ct);
        var totalConsultations     = await db.Set<ConsultationModel>().CountAsync(ct);
        var completedConsultations = await db.Set<ConsultationModel>().CountAsync(c => c.Status == ConsultationStatus.Completed, ct);
        var cancelledConsultations = await db.Set<ConsultationModel>().CountAsync(c => c.Status == ConsultationStatus.Cancelled, ct);
        var todayConsultations     = await db.Set<ConsultationModel>().CountAsync(c => c.CreatedAt >= today, ct);

        return new AdminDashboardResponse(
            TotalDoctors:           totalDoctors,
            PendingDoctors:         pendingDoctors,
            SuspendedDoctors:       suspendedDoctors,
            TotalActivePatients:    totalActivePatients,
            TotalConsultations:     totalConsultations,
            CompletedConsultations: completedConsultations,
            CancelledConsultations: cancelledConsultations,
            TodayConsultations:     todayConsultations
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR MODERATION — LIST
    // ════════════════════════════════════════════════════════════════════════

    public async Task<PaginatedResponse<AdminPendingDoctorItem>> GetPendingDoctorsAsync(
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var query = from d in db.Set<DoctorModel>()
                    join u in db.Set<User>() on d.UserId equals u.Id
                    where d.DeletedAt == null && d.ApprovalStatus == ApprovalStatus.Pending
                    orderby d.CreatedAt descending
                    select new AdminPendingDoctorItem(
                        d.Id,
                        d.UserId,
                        u.FullName,
                        u.Email,
                        d.Specialization,
                        d.Qualification,
                        d.LicenseNumber,
                        d.ExperienceYears,
                        d.City,
                        d.IsProfileCompleted,
                        d.CreatedAt
                    );

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        return PaginatedResponse<AdminPendingDoctorItem>.Create(items, total, page, pageSize);
    }

    public async Task<PaginatedResponse<AdminDoctorListItem>> GetAllDoctorsAsync(
        AdminDoctorListQuery filter,
        CancellationToken ct = default)
    {
        var query = from d in db.Set<DoctorModel>()
                    join u in db.Set<User>() on d.UserId equals u.Id
                    where d.DeletedAt == null
                    select new { d, u };

        // ── Apply filters ─────────────────────────────────────────────────────
        if (!string.IsNullOrWhiteSpace(filter.ApprovalStatus) &&
            Enum.TryParse<ApprovalStatus>(filter.ApprovalStatus, ignoreCase: true, out var status))
            query = query.Where(x => x.d.ApprovalStatus == status);

        if (!string.IsNullOrWhiteSpace(filter.City))
            query = query.Where(x => x.d.City != null && x.d.City.ToLower().Contains(filter.City.ToLower()));

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(x =>
                x.u.FullName.ToLower().Contains(search) ||
                (x.u.Email != null && x.u.Email.ToLower().Contains(search)) ||
                (x.d.LicenseNumber != null && x.d.LicenseNumber.ToLower().Contains(search)));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(x => x.d.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(x => new AdminDoctorListItem(
                x.d.Id,
                x.d.UserId,
                x.u.FullName,
                x.u.Email,
                x.d.Specialization,
                x.d.ApprovalStatus.ToString(),
                x.d.IsPubliclyVisible,
                x.d.IsProfileCompleted,
                x.d.City,
                x.d.CreatedAt
            ))
            .ToListAsync(ct);

        return PaginatedResponse<AdminDoctorListItem>.Create(items, total, filter.Page, filter.PageSize);
    }

    // ════════════════════════════════════════════════════════════════════════
    // DOCTOR MODERATION — STATE TRANSITIONS
    // ════════════════════════════════════════════════════════════════════════

    public async Task<DoctorModerationResponse> ApproveDoctorAsync(
        Guid adminId,
        Guid doctorId,
        DoctorModerationRequest request,
        CancellationToken ct = default)
    {
        var doctor = await RequireDoctorAsync(doctorId, ct);

        if (doctor.ApprovalStatus is not (ApprovalStatus.Pending or ApprovalStatus.Rejected))
            throw new ConflictException($"Doctor is currently '{doctor.ApprovalStatus}' and cannot be approved from this state.");

        if (!doctor.IsProfileCompleted)
            throw new ConflictException("Doctor profile is incomplete and cannot be approved.");

        var previous = doctor.ApprovalStatus;
        doctor.ApprovalStatus    = ApprovalStatus.Approved;
        doctor.IsPubliclyVisible = doctor.IsProfileCompleted;
        doctor.UpdatedAt         = DateTime.UtcNow;

        await CreateAuditLogAsync(adminId, AdminActionType.DoctorApproved, AdminTargetEntityType.Doctor, doctorId, request.Reason, ct);
        await db.SaveChangesAsync(ct);

        // Notify the doctor in real-time so the pending page can redirect immediately.
        await notificationService.SendToUserAsync(
            doctor.UserId.ToString(),
            "DoctorStatusUpdated",
            new { ApprovalStatus = doctor.ApprovalStatus.ToString() },
            ct);

        logger.LogInformation(
            "[AdminService] Doctor approved. DoctorId={DoctorId} PreviousStatus={Previous} AdminId={AdminId}",
            doctorId, previous, adminId);

        return new DoctorModerationResponse(doctorId, doctor.ApprovalStatus.ToString(), doctor.IsPubliclyVisible);
    }

    public async Task<DoctorModerationResponse> RejectDoctorAsync(
        Guid adminId,
        Guid doctorId,
        DoctorModerationRequest request,
        CancellationToken ct = default)
    {
        var doctor = await RequireDoctorAsync(doctorId, ct);

        if (doctor.ApprovalStatus != ApprovalStatus.Pending)
            throw new ConflictException($"Only Pending doctors can be rejected. Current status: '{doctor.ApprovalStatus}'.");

        doctor.ApprovalStatus    = ApprovalStatus.Rejected;
        doctor.IsPubliclyVisible = false;
        doctor.UpdatedAt         = DateTime.UtcNow;

        await CreateAuditLogAsync(adminId, AdminActionType.DoctorRejected, AdminTargetEntityType.Doctor, doctorId, request.Reason, ct);
        await db.SaveChangesAsync(ct);

        // Notify the doctor in real-time.
        await notificationService.SendToUserAsync(
            doctor.UserId.ToString(),
            "DoctorStatusUpdated",
            new { ApprovalStatus = doctor.ApprovalStatus.ToString() },
            ct);

        logger.LogInformation(
            "[AdminService] Doctor rejected. DoctorId={DoctorId} AdminId={AdminId} Reason={Reason}",
            doctorId, adminId, request.Reason);

        return new DoctorModerationResponse(doctorId, doctor.ApprovalStatus.ToString(), doctor.IsPubliclyVisible);
    }

    public async Task<DoctorModerationResponse> SuspendDoctorAsync(
        Guid adminId,
        Guid doctorId,
        DoctorModerationRequest request,
        CancellationToken ct = default)
    {
        var doctor = await RequireDoctorAsync(doctorId, ct);

        if (doctor.ApprovalStatus != ApprovalStatus.Approved)
            throw new ConflictException($"Only Approved doctors can be suspended. Current status: '{doctor.ApprovalStatus}'.");

        doctor.ApprovalStatus    = ApprovalStatus.Suspended;
        doctor.IsPubliclyVisible = false;
        doctor.UpdatedAt         = DateTime.UtcNow;

        await CreateAuditLogAsync(adminId, AdminActionType.DoctorSuspended, AdminTargetEntityType.Doctor, doctorId, request.Reason, ct);
        await db.SaveChangesAsync(ct);

        // Notify the doctor in real-time.
        await notificationService.SendToUserAsync(
            doctor.UserId.ToString(),
            "DoctorStatusUpdated",
            new { ApprovalStatus = doctor.ApprovalStatus.ToString() },
            ct);

        logger.LogInformation(
            "[AdminService] Doctor suspended. DoctorId={DoctorId} AdminId={AdminId} Reason={Reason}",
            doctorId, adminId, request.Reason);

        return new DoctorModerationResponse(doctorId, doctor.ApprovalStatus.ToString(), doctor.IsPubliclyVisible);
    }

    public async Task<DoctorModerationResponse> ReactivateDoctorAsync(
        Guid adminId,
        Guid doctorId,
        DoctorModerationRequest request,
        CancellationToken ct = default)
    {
        var doctor = await RequireDoctorAsync(doctorId, ct);

        if (doctor.ApprovalStatus != ApprovalStatus.Suspended)
            throw new ConflictException($"Only Suspended doctors can be reactivated. Current status: '{doctor.ApprovalStatus}'.");

        doctor.ApprovalStatus    = ApprovalStatus.Approved;
        doctor.IsPubliclyVisible = doctor.IsProfileCompleted;
        doctor.UpdatedAt         = DateTime.UtcNow;

        await CreateAuditLogAsync(adminId, AdminActionType.DoctorReactivated, AdminTargetEntityType.Doctor, doctorId, request.Reason, ct);
        await db.SaveChangesAsync(ct);

        // Notify the doctor in real-time.
        await notificationService.SendToUserAsync(
            doctor.UserId.ToString(),
            "DoctorStatusUpdated",
            new { ApprovalStatus = doctor.ApprovalStatus.ToString() },
            ct);

        logger.LogInformation(
            "[AdminService] Doctor reactivated. DoctorId={DoctorId} AdminId={AdminId}",
            doctorId, adminId);

        return new DoctorModerationResponse(doctorId, doctor.ApprovalStatus.ToString(), doctor.IsPubliclyVisible);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PATIENT MODERATION
    // ════════════════════════════════════════════════════════════════════════

    public async Task<PaginatedResponse<AdminPatientListItem>> GetAllPatientsAsync(
        AdminPatientListQuery filter,
        CancellationToken ct = default)
    {
        var query = db.Set<User>()
            .Where(u => u.Role == UserRole.Patient)
            .AsQueryable();

        if (filter.IsActive.HasValue)
            query = query.Where(u => u.IsActive == filter.IsActive.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.ToLower();
            query = query.Where(u =>
                u.FullName.ToLower().Contains(s) ||
                u.PhoneNumber.ToLower().Contains(s));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(u => new AdminPatientListItem(
                u.Id,
                u.FullName,
                u.PhoneNumber,
                u.IsActive,
                u.IsVerified,
                u.CreatedAt
            ))
            .ToListAsync(ct);

        return PaginatedResponse<AdminPatientListItem>.Create(items, total, filter.Page, filter.PageSize);
    }

    public async Task<PatientModerationResponse> BlockPatientAsync(
        Guid adminId,
        Guid patientUserId,
        PatientModerationRequest request,
        CancellationToken ct = default)
    {
        var user = await RequirePatientUserAsync(patientUserId, ct);

        if (!user.IsActive)
            throw new ConflictException("Patient account is already blocked.");

        user.IsActive = false;

        await CreateAuditLogAsync(adminId, AdminActionType.PatientBlocked, AdminTargetEntityType.Patient, patientUserId, request.Reason, ct);
        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "[AdminService] Patient blocked. UserId={UserId} AdminId={AdminId} Reason={Reason}",
            patientUserId, adminId, request.Reason);

        return new PatientModerationResponse(patientUserId, false);
    }

    public async Task<PatientModerationResponse> UnblockPatientAsync(
        Guid adminId,
        Guid patientUserId,
        PatientModerationRequest request,
        CancellationToken ct = default)
    {
        var user = await RequirePatientUserAsync(patientUserId, ct);

        if (user.IsActive)
            throw new ConflictException("Patient account is already active.");

        user.IsActive = true;

        await CreateAuditLogAsync(adminId, AdminActionType.PatientUnblocked, AdminTargetEntityType.Patient, patientUserId, request.Reason, ct);
        await db.SaveChangesAsync(ct);

        logger.LogInformation(
            "[AdminService] Patient unblocked. UserId={UserId} AdminId={AdminId}",
            patientUserId, adminId);

        return new PatientModerationResponse(patientUserId, true);
    }

    // ════════════════════════════════════════════════════════════════════════
    // CONSULTATION MONITORING (read-only)
    // ════════════════════════════════════════════════════════════════════════

    public async Task<PaginatedResponse<AdminConsultationListItem>> GetAllConsultationsAsync(
        AdminConsultationListQuery filter,
        CancellationToken ct = default)
    {
        var query = from c in db.Set<ConsultationModel>()
                    // Patient profile → User
                    join pat in db.Set<PatientModel>() on c.PatientId equals pat.Id into patJoin
                    from pat in patJoin.DefaultIfEmpty()
                    join patUser in db.Set<User>() on pat.UserId equals patUser.Id into patUserJoin
                    from patUser in patUserJoin.DefaultIfEmpty()
                    // Doctor profile → User
                    join doc in db.Set<DoctorModel>() on c.DoctorId equals doc.Id into docJoin
                    from doc in docJoin.DefaultIfEmpty()
                    join docUser in db.Set<User>() on doc.UserId equals docUser.Id into docUserJoin
                    from docUser in docUserJoin.DefaultIfEmpty()
                    select new { c, pat, patUser, doc, docUser };

        if (!string.IsNullOrWhiteSpace(filter.Status) &&
            Enum.TryParse<ConsultationStatus>(filter.Status, ignoreCase: true, out var csStatus))
            query = query.Where(x => x.c.Status == csStatus);

        if (filter.DoctorId.HasValue)
            query = query.Where(x => x.c.DoctorId == filter.DoctorId.Value);

        if (filter.PatientId.HasValue)
            query = query.Where(x => x.c.PatientId == filter.PatientId.Value);

        if (filter.DateFrom.HasValue)
            query = query.Where(x => x.c.ScheduledDate >= filter.DateFrom.Value);

        if (filter.DateTo.HasValue)
            query = query.Where(x => x.c.ScheduledDate <= filter.DateTo.Value);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(x => x.c.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(x => new AdminConsultationListItem(
                x.c.Id,
                x.c.ConsultationNumber,
                x.patUser != null ? x.patUser.FullName : "Unknown",
                x.docUser != null ? x.docUser.FullName : "Unknown",
                x.doc != null ? x.doc.Specialization : null,
                x.c.Status.ToString(),
                x.c.ScheduledDate,
                x.c.StartTime,
                x.c.CreatedAt
            ))
            .ToListAsync(ct);

        return PaginatedResponse<AdminConsultationListItem>.Create(items, total, filter.Page, filter.PageSize);
    }

    public async Task<AdminConsultationDetail> GetConsultationDetailAsync(
        Guid consultationId,
        CancellationToken ct = default)
    {
        var result = await (from c in db.Set<ConsultationModel>()
                            // Patient profile → User
                            join pat in db.Set<PatientModel>() on c.PatientId equals pat.Id into patJoin
                            from pat in patJoin.DefaultIfEmpty()
                            join patUser in db.Set<User>() on pat.UserId equals patUser.Id into patUserJoin
                            from patUser in patUserJoin.DefaultIfEmpty()
                            // Doctor profile → User
                            join doc in db.Set<DoctorModel>() on c.DoctorId equals doc.Id into docJoin
                            from doc in docJoin.DefaultIfEmpty()
                            join docUser in db.Set<User>() on doc.UserId equals docUser.Id into docUserJoin
                            from docUser in docUserJoin.DefaultIfEmpty()
                            where c.Id == consultationId
                            select new { c, patUser, doc, docUser })
                           .FirstOrDefaultAsync(ct)
                   ?? throw NotFoundException.For("Consultation", consultationId);

        var statusHistory = await db.Set<ConsultationStatusHistory>()
            .Where(h => h.ConsultationId == consultationId)
            .OrderBy(h => h.CreatedAt)
            .Select(h => new ConsultationStatusHistoryItem(
                h.NewStatus.ToString(),
                h.OldStatus.HasValue ? h.OldStatus.ToString() : null,
                h.Reason,
                h.CreatedAt
            ))
            .ToListAsync(ct);

        return new AdminConsultationDetail(
            ConsultationId:    result.c.Id,
            ConsultationNumber: result.c.ConsultationNumber,
            PatientName:       result.patUser != null ? result.patUser.FullName : "Unknown",
            PatientPhone:      result.patUser != null ? result.patUser.PhoneNumber : "",
            DoctorName:        result.docUser != null ? result.docUser.FullName : "Unknown",
            Specialization:    result.doc?.Specialization,
            Status:            result.c.Status.ToString(),
            ScheduledDate:     result.c.ScheduledDate,
            StartTime:         result.c.StartTime,
            EndTime:           result.c.EndTime,
            Symptoms:          result.c.Symptoms,
            CancellationReason: result.c.CancellationReason,
            MeetingStartedAt:  result.c.MeetingStartedAt,
            MeetingEndedAt:    result.c.MeetingEndedAt,
            CreatedAt:         result.c.CreatedAt,
            StatusHistory:     statusHistory
        );
    }

    // ════════════════════════════════════════════════════════════════════════
    // AUDIT LOGS
    // ════════════════════════════════════════════════════════════════════════

    public async Task<PaginatedResponse<AdminAuditLogListItem>> GetAuditLogsAsync(
        AdminAuditLogQuery filter,
        CancellationToken ct = default)
    {
        var query = from log in db.Set<AdminAuditLog>()
                    join admin in db.Set<User>() on log.AdminUserId equals admin.Id into adminJoin
                    from admin in adminJoin.DefaultIfEmpty()
                    select new { log, admin };

        if (filter.AdminUserId.HasValue)
            query = query.Where(x => x.log.AdminUserId == filter.AdminUserId.Value);

        if (!string.IsNullOrWhiteSpace(filter.ActionType) &&
            Enum.TryParse<AdminActionType>(filter.ActionType, ignoreCase: true, out var actionType))
            query = query.Where(x => x.log.ActionType == actionType);

        if (!string.IsNullOrWhiteSpace(filter.TargetEntityType) &&
            Enum.TryParse<AdminTargetEntityType>(filter.TargetEntityType, ignoreCase: true, out var entityType))
            query = query.Where(x => x.log.TargetEntityType == entityType);

        if (filter.TargetEntityId.HasValue)
            query = query.Where(x => x.log.TargetEntityId == filter.TargetEntityId.Value);

        if (filter.DateFrom.HasValue)
            query = query.Where(x => x.log.CreatedAt >= filter.DateFrom.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));

        if (filter.DateTo.HasValue)
            query = query.Where(x => x.log.CreatedAt <= filter.DateTo.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc));

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(x => x.log.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(x => new AdminAuditLogListItem(
                x.log.Id,
                x.log.AdminUserId,
                x.admin != null ? x.admin.FullName : "Unknown",
                x.log.ActionType.ToString(),
                x.log.TargetEntityType.ToString(),
                x.log.TargetEntityId,
                x.log.Reason,
                x.log.CreatedAt
            ))
            .ToListAsync(ct);

        return PaginatedResponse<AdminAuditLogListItem>.Create(items, total, filter.Page, filter.PageSize);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ════════════════════════════════════════════════════════════════════════

    private async Task<DoctorModel> RequireDoctorAsync(Guid doctorId, CancellationToken ct)
        => await db.Set<DoctorModel>()
               .FirstOrDefaultAsync(d => d.Id == doctorId && d.DeletedAt == null, ct)
           ?? throw NotFoundException.For("Doctor", doctorId);

    private async Task<User> RequirePatientUserAsync(Guid userId, CancellationToken ct)
    {
        var user = await db.Set<User>()
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw NotFoundException.For("Patient", userId);

        if (user.Role != UserRole.Patient)
            throw new ForbiddenException("The specified user is not a Patient account.");

        return user;
    }

    private async Task CreateAuditLogAsync(
        Guid adminId,
        AdminActionType actionType,
        AdminTargetEntityType targetType,
        Guid targetId,
        string? reason,
        CancellationToken ct)
    {
        var log = new AdminAuditLog
        {
            Id               = Guid.NewGuid(),
            AdminUserId      = adminId,
            ActionType       = actionType,
            TargetEntityType = targetType,
            TargetEntityId   = targetId,
            Reason           = reason,
            CreatedAt        = DateTime.UtcNow
        };

        db.Set<AdminAuditLog>().Add(log);
        // Note: SaveChangesAsync is called by the calling method after all mutations
    }
}

