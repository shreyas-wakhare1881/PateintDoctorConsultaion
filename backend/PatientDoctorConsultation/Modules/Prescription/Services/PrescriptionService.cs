using Microsoft.EntityFrameworkCore;
using PatientDoctorConsultation.Infrastructure.Persistence.Context;
using PatientDoctorConsultation.Modules.Prescription.DTOs;
using PatientDoctorConsultation.Modules.Prescription.Interfaces;
using PatientDoctorConsultation.Modules.Prescription.Models;
using PatientDoctorConsultation.Shared.Constants;
using PatientDoctorConsultation.Shared.Enums;
using PatientDoctorConsultation.Shared.Exceptions;
using DoctorModel = PatientDoctorConsultation.Modules.Doctor.Models.Doctor;
using PatientModel = PatientDoctorConsultation.Modules.Patient.Models.Patient;
namespace PatientDoctorConsultation.Modules.Prescription.Services;

public class PrescriptionService(ApplicationDbContext db) : IPrescriptionService
{
    public async Task<PrescriptionResponse> CreateAsync(
        Guid consultationId,
        Guid doctorUserId,
        CreatePrescriptionRequest request,
        CancellationToken ct = default)
    {
        // Resolve Doctor entity ID from the authenticated User ID
        var doctorEntityId = await db.Set<DoctorModel>()
            .Where(d => d.UserId == doctorUserId && d.DeletedAt == null)
            .Select(d => d.Id)
            .FirstOrDefaultAsync(ct);

        if (doctorEntityId == Guid.Empty)
            throw new NotFoundException("Doctor profile not found.");

        var consultation = await db.Set<Modules.Consultation.Models.Consultation>()
            .FirstOrDefaultAsync(c => c.Id == consultationId, ct)
            ?? throw new NotFoundException("Consultation not found.");

        if (consultation.DoctorId != doctorEntityId)
            throw new ForbiddenException("You are not the assigned doctor for this consultation.");

        if (consultation.Status != ConsultationStatus.InProgress &&
            consultation.Status != ConsultationStatus.Completed)
            throw DomainValidationException.For("status", "A prescription can only be created for InProgress or Completed consultations.");

        var existing = await db.Set<Models.Prescription>()
            .AnyAsync(p => p.ConsultationId == consultationId, ct);
        if (existing)
            throw new ConflictException("A prescription already exists for this consultation.");

        if (request.Items == null || request.Items.Count == 0)
            throw DomainValidationException.For("items", "At least one prescription item is required.");

        var prescription = new Models.Prescription
        {
            ConsultationId = consultationId,
            DoctorId = doctorEntityId,
            PatientId = consultation.PatientId,
            Diagnosis = request.Diagnosis?.Trim(),
            GeneralInstructions = request.GeneralInstructions?.Trim(),
            IssuedAt = DateTime.UtcNow,
            Items = request.Items.Select(i => new PrescriptionItem
            {
                MedicineName = i.MedicineName.Trim(),
                Dosage = i.Dosage.Trim(),
                Frequency = i.Frequency.Trim(),
                Duration = i.Duration.Trim(),
                Instructions = i.Instructions?.Trim(),
            }).ToList()
        };

        db.Set<Models.Prescription>().Add(prescription);
        await db.SaveChangesAsync(ct);

        return MapToResponse(prescription);
    }

    public async Task<PrescriptionResponse> GetByConsultationAsync(
        Guid consultationId,
        Guid callerUserId,
        string callerRole,
        CancellationToken ct = default)
    {
        var prescription = await db.Set<Models.Prescription>()
            .Include(p => p.Items)
            .FirstOrDefaultAsync(p => p.ConsultationId == consultationId, ct)
            ?? throw new NotFoundException("No prescription found for this consultation.");

        if (callerRole == Roles.Doctor)
        {
            var doctorEntityId = await db.Set<DoctorModel>()
                .Where(d => d.UserId == callerUserId && d.DeletedAt == null)
                .Select(d => d.Id)
                .FirstOrDefaultAsync(ct);

            if (prescription.DoctorId != doctorEntityId)
                throw new ForbiddenException("You are not the assigned doctor for this consultation.");
        }
        else if (callerRole == Roles.Patient)
        {
            var patientEntityId = await db.Set<PatientModel>()
                .Where(p => p.UserId == callerUserId)
                .Select(p => p.Id)
                .FirstOrDefaultAsync(ct);

            if (prescription.PatientId != patientEntityId)
                throw new ForbiddenException("This prescription does not belong to you.");
        }

        return MapToResponse(prescription);
    }

    public async Task<List<PrescriptionResponse>> GetMyPrescriptionsAsync(
        Guid patientUserId,
        CancellationToken ct = default)
    {
        // Resolve Patient entity ID from the authenticated User ID
        var patientEntityId = await db.Set<PatientModel>()
            .Where(p => p.UserId == patientUserId)
            .Select(p => p.Id)
            .FirstOrDefaultAsync(ct);

        if (patientEntityId == Guid.Empty)
            throw new NotFoundException("Patient profile not found.");

        var prescriptions = await db.Set<Models.Prescription>()
            .Include(p => p.Items)
            .Where(p => p.PatientId == patientEntityId)
            .OrderByDescending(p => p.IssuedAt)
            .ToListAsync(ct);

        return prescriptions.Select(MapToResponse).ToList();
    }

    private static PrescriptionResponse MapToResponse(Models.Prescription p) =>
        new(
            p.Id,
            p.ConsultationId,
            p.DoctorId,
            p.PatientId,
            p.Diagnosis,
            p.GeneralInstructions,
            p.IssuedAt,
            p.Items.Select(i => new PrescriptionItemResponse(
                i.Id,
                i.MedicineName,
                i.Dosage,
                i.Frequency,
                i.Duration,
                i.Instructions
            )).ToList(),
            p.CreatedAt
        );
}
