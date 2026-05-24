# Consultation Module — Specification Overview

> **Module:** Consultation  
> **Bounded Context:** Patient-Doctor Appointment & Session Lifecycle  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-24

---

## 1. Purpose

The Consultation Module manages the complete lifecycle of healthcare appointments on the PatientDoctorConsultation platform — from initial booking by a patient through doctor confirmation, active session management, and final completion.

It is the central transactional module of the platform, bridging the Patient Module and Doctor Module through a well-defined booking workflow inspired by production healthcare platforms such as Practo, Apollo 247, and Zocdoc.

---

## 2. Business Purpose

This module solves the core product challenge: **connecting verified patients with approved doctors through a reliable, auditable appointment workflow**.

A consultation goes through a defined lifecycle:
1. Patient searches for an approved doctor and submits a booking request
2. Doctor reviews and confirms or rejects the request
3. On the scheduled date, the doctor starts and completes the session
4. Full status history is maintained for every transition

Until a doctor is approved and publicly visible, no patient can book a consultation with them. Until a consultation is confirmed, no session can begin.

---

## 3. Core Features

| Feature | Description |
|---------|-------------|
| **Consultation Booking** | Patient-initiated booking with symptom capture and type selection (Video / InPerson) |
| **Doctor Response Workflow** | Doctor confirms or rejects each pending request |
| **Status Lifecycle Management** | Strict state machine: Pending → Confirmed → InProgress → Completed |
| **Cancellation Handling** | Supported from Pending or Confirmed states; captures reason and who cancelled |
| **Fee Snapshot** | Doctor's consultation fee is frozen at booking time; immune to future profile changes |
| **Status Audit Trail** | Every status transition writes an immutable `ConsultationStatusHistory` record |
| **Follow-Up Consultations** | Patients can book follow-ups linked to a completed parent consultation |
| **Human-Readable Booking ID** | `ConsultationNumber` field (e.g., `CONS-20260610-0042`) for support and billing reference |
| **NoShow Handling** | Doctor or Admin can mark a confirmed session as `NoShow` if the patient is absent |
| **Soft Delete** | Consultations are never hard-deleted; `DeletedAt` supports compliance requirements |

---

## 4. Database Tables

| Table | Purpose |
|-------|---------|
| `Consultations` | Core booking record: participants, schedule, status, fee snapshot, clinical data, video fields |
| `ConsultationStatusHistories` | Append-only audit log of every status transition on a consultation |

> Full schema details: [Database.md](./Database.md)

---

## 5. Architecture Notes

**Modular Monolith boundaries:**
- Consultation Module references `PatientId` (FK → `Patients.Id`) and `DoctorId` (FK → `Doctors.Id`) but does not own patient or doctor authentication logic
- Doctor approval state (`IsPubliclyVisible`) is read from the Doctor Module at booking time — Consultation Module does not duplicate this logic
- `ConsultationFeeSnapshot` decouples billing from the Doctor Module — fee changes after booking do not affect historical records
- `Doctors.TotalConsultations` is incremented by the Consultation Module on completion — this is the only cross-module write operation
- Admin operations on consultations route through the Admin Module's controller layer, delegating to the Consultation Module's service

**State machine enforcement:**
- All status transitions are validated at the service layer — invalid transitions return `422 Unprocessable Entity`
- Every valid transition produces an immutable `ConsultationStatusHistory` row — no exceptions

---

## 6. Business Rules

| Rule | Enforcement Point |
|------|------------------|
| Doctor must be `Approved` + `IsPubliclyVisible = true` to receive bookings | Booking validation |
| `ScheduledDate + StartTime` must be in the future at booking time | Booking validation |
| No duplicate bookings (same patient + doctor + date/time in Pending/Confirmed) | Booking validation |
| Fee snapshot is immutable after creation | Database + service layer |
| Terminal states (Completed, Cancelled, Rejected, NoShow) cannot be transitioned | Service layer state machine |
| Cancellation requires a reason; only from Pending or Confirmed | Cancellation endpoint |
| Only the assigned doctor can confirm, reject, start, or complete a consultation | Authorization check |
| Patient can only access and cancel their own consultations | Authorization check |
| Follow-up parent must be a Completed consultation with the same DoctorId | Follow-up booking validation |

---

## 7. Consultation Lifecycle Summary

```
[Patient Books]
      │
      ▼
   Pending ──────────────────────────────── Rejected (Doctor)
      │
      ▼
  Confirmed ─────────────────────────────── Cancelled (Patient / Doctor / Admin)
      │                                     NoShow (Doctor / Admin)
      ▼
  InProgress
      │
      ▼
  Completed ──► (Optional Follow-Up Booked as new Consultation)
```

**Terminal states:** `Completed`, `Cancelled`, `Rejected`, `NoShow`  
**Audit:** Every arrow above writes one row to `ConsultationStatusHistories`

---

## 8. API Summary

| Method | Route | Role | Purpose |
|--------|-------|------|---------|
| `POST` | `/api/consultations` | Patient | Book a consultation |
| `GET` | `/api/consultations/my` | Patient | Patient's consultation history |
| `GET` | `/api/consultations/{id}` | Patient, Doctor, Admin | Consultation details |
| `PUT` | `/api/consultations/{id}/cancel` | Patient, Doctor, Admin | Cancel a consultation |
| `GET` | `/api/consultations/requests` | Doctor | Pending booking requests |
| `PUT` | `/api/consultations/{id}/confirm` | Doctor | Confirm a request |
| `PUT` | `/api/consultations/{id}/reject` | Doctor | Reject a request |
| `GET` | `/api/consultations/schedule` | Doctor | Doctor's confirmed schedule |
| `PUT` | `/api/consultations/{id}/start` | Doctor | Start session (InProgress) |
| `PUT` | `/api/consultations/{id}/complete` | Doctor | Complete session |
| `GET` | `/api/consultations/{id}/history` | Patient, Doctor, Admin | Status audit trail |
| `GET` | `/api/admin/consultations` | Admin | All consultations (paginated) |

> Full API contracts: [APIs.md](./APIs.md)

---

## 9. Module Dependencies

| Dependency | Type | Reason |
|---|---|---|
| Auth Module (`Users`) | Read | `ChangedByUserId` in status history; JWT validation |
| Doctor Module (`Doctors`) | Read | Approval status, fee snapshot, `IsPubliclyVisible` check |
| Doctor Module (`DoctorAvailabilities`) | Read + Write | Slot availability validation; slot occupation on booking |
| Patient Module (`Patients`) | Read | Patient identity for booking and response payloads |
| Doctor Module (`Doctors.TotalConsultations`) | Write | Incremented on consultation completion |

---

## 10. Future Scope

The following capabilities are **not implemented in this module** but the data model is designed to support them:

| Feature | Foundation Already Present |
|---------|---------------------------|
| **Video Consultation** | `MeetingRoomId`, `MeetingLink`, `MeetingStartedAt`, `MeetingEndedAt` fields reserved |
| **Prescriptions** | `Notes` field captures clinical data; dedicated Prescription module can reference `ConsultationId` |
| **Payments & Refunds** | `ConsultationFeeSnapshot` provides immutable billing basis; Payment module can reference it |
| **Notifications** | Status transitions are fully audited; Notification module can subscribe to status change events |
| **Medical Records** | `ConsultationId` serves as the anchor for attaching lab reports, prescriptions, and summaries |
| **AI Clinical Summaries** | `Notes` and `Symptoms` fields provide input data for AI summarization pipeline |
| **Ratings & Reviews** | `Completed` consultations provide the event trigger; Review module references `ConsultationId` |

