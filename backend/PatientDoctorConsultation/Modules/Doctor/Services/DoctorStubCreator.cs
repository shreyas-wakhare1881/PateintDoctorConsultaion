using Microsoft.EntityFrameworkCore;
using PatientDoctorConsultation.Infrastructure.Persistence.Context;
using PatientDoctorConsultation.Modules.Shared.Interfaces;
using PatientDoctorConsultation.Shared.Enums;
using DoctorModel = PatientDoctorConsultation.Modules.Doctor.Models.Doctor;

namespace PatientDoctorConsultation.Modules.Doctor.Services;

/// <summary>
/// Creates a minimal Doctor stub row at Doctor registration time.
/// This lives in the Doctor module to avoid circular dependencies with the Auth module.
/// </summary>
public sealed class DoctorStubCreator(ApplicationDbContext db) : IDoctorStubCreator
{
    public async Task CreateStubAsync(Guid userId, CancellationToken ct = default)
    {
        // Idempotent — if stub already exists, skip.
        var alreadyExists = await db.Set<DoctorModel>()
            .AnyAsync(d => d.UserId == userId, ct);

        if (alreadyExists) return;

        var stub = new DoctorModel
        {
            UserId             = userId,
            ApprovalStatus     = ApprovalStatus.Pending,
            IsProfileCompleted = false,
            IsPubliclyVisible  = false,
            TotalReviews       = 0,
            TotalConsultations = 0,
            CreatedAt          = DateTime.UtcNow,
        };

        db.Set<DoctorModel>().Add(stub);
        await db.SaveChangesAsync(ct);
    }
}
