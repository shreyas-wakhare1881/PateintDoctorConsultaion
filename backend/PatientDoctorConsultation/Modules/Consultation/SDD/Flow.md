# Consultation Module — Business Flow Specification

> **Module:** Consultation  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-24

---

## 1. Consultation Booking Flow

**Trigger:** Authenticated patient selects a doctor and submits a booking request.

```
Patient                         API (Consultation Module)            Database
  │                                       │                              │
  │── GET /api/doctors ───────────────────►│                              │
  │   (filter by city, specialization)    │── Return publicly visible    │
  │◄── 200 { doctors[] } ─────────────────│   approved doctors           │
  │                                       │                              │
  │── GET /api/doctors/{id}/availability ─►│                              │
  │◄── 200 { availableSlots[] } ──────────│                              │
  │                                       │                              │
  │── POST /api/consultations ────────────►│── Validate JWT (Patient)     │
  │   { doctorId, availabilityId,         │── Validate doctor: Approved  │
  │     scheduledDate, startTime,         │   + IsPubliclyVisible = true │
  │     consultationType, symptoms }      │── Validate slot: not booked  │
  │                                       │── Validate: no past date     │
  │                                       │── Check: no duplicate booking│
  │                                       │   (same patient+doctor+date) │
  │                                       │── Generate ConsultationNumber│
  │                                       │── Snapshot ConsultationFee   │
  │                                       │── Create Consultation row ──►│
  │                                       │   (Status = Pending)         │
  │                                       │── Create StatusHistory row ──►│
  │                                       │   (NULL → Pending)           │
  │◄── 201 { consultation } ──────────────│                              │
```

**Steps:**
1. Patient browses publicly visible, approved doctors and views their availability
2. Patient selects a slot and submits booking with symptoms and consultation type
3. System validates: doctor is approved and publicly visible
4. System validates: slot is available (not already booked or blocked)
5. System validates: `ScheduledDate` is not in the past
6. System checks for duplicate booking: same patient + same doctor + same scheduled date/time must not exist in `Pending` or `Confirmed` state
7. `ConsultationFeeSnapshot` is captured from `Doctors.ConsultationFee` at this moment — immutable thereafter
8. `ConsultationNumber` is generated as a human-readable booking reference
9. `Consultations` row created with `Status = Pending`
10. `ConsultationStatusHistories` row inserted: `OldStatus = NULL`, `NewStatus = Pending`
11. Doctor receives notification of new pending request (notification module — future)

---

## 2. Doctor Response Flow

**Trigger:** Doctor views pending consultation requests in their dashboard and responds.

```
Doctor                         API (Consultation Module)           Database
  │                                      │                              │
  │── GET /api/consultations/requests ──►│── Validate JWT (Doctor)      │
  │◄── 200 { pendingConsultations[] } ───│── Return Status = Pending    │
  │                                      │   for this DoctorId          │
  │                                      │                              │
  │── PUT /api/consultations/{id}/confirm►│── Validate: Status = Pending │
  │   or                                 │── Validate: owned by Doctor  │
  │── PUT /api/consultations/{id}/reject ►│── Validate: not soft-deleted │
  │   { reason? }                        │── Update Status ────────────►│
  │                                      │── Insert StatusHistory row ──►│
  │◄── 200 { updatedConsultation } ───────│                              │
```

**Confirm path:**
1. Doctor accepts the booking
2. Status transitions: `Pending → Confirmed`
3. If `ConsultationType = Video`: `MeetingRoomId` and `MeetingLink` are generated and stored
4. `ConsultationStatusHistories` row inserted: `Pending → Confirmed`
5. Patient notified (future notification module)

**Reject path:**
1. Doctor declines with optional reason
2. Status transitions: `Pending → Rejected`
3. `ConsultationStatusHistories` row inserted: `Pending → Rejected`, reason stored
4. Rejected consultations are immutable — no further transitions allowed
5. Patient notified of rejection (future notification module)

---

## 3. Consultation Lifecycle Flow

**Full happy path from booking to completion:**

```
[Booking Submitted]
        │
        ▼
    Pending ──────────────────────────────► Rejected (by Doctor)
        │
        ▼
   Confirmed ─────────────────────────────► Cancelled (by Patient/Doctor/Admin)
        │                                             │
        │                                   (before session starts)
        ▼
   InProgress ─────────────────────────────► (no cancel allowed here)
        │
        ▼
   Completed
        │
   (Optional)
        ▼
   Follow-Up Booked (new Consultation, IsFollowUp=true)
```

**InProgress transition:**
1. Doctor triggers "Start Consultation" action at or after `ScheduledDate + StartTime`
2. Status transitions: `Confirmed → InProgress`
3. For Video type: `MeetingStartedAt` is stamped at this point
4. `ConsultationStatusHistories` row inserted

**Completed transition:**
1. Doctor triggers "Complete Consultation" action
2. Doctor may optionally add clinical `Notes`
3. Status transitions: `InProgress → Completed`
4. For Video type: `MeetingEndedAt` is stamped
5. `Doctors.TotalConsultations` is incremented (Doctor Module responsibility)
6. `ConsultationStatusHistories` row inserted

**NoShow transition:**
1. System or Admin marks consultation as `NoShow` if patient did not attend a `Confirmed` booking
2. Status transitions: `Confirmed → NoShow`
3. `ConsultationStatusHistories` row inserted

---

## 4. Cancellation Flow

**Trigger:** Patient, Doctor, or Admin cancels a booking before the session has started.

```
Actor (Patient/Doctor/Admin)    API                           Database
  │                              │                                │
  │── PUT /api/consultations     │── Validate JWT                 │
  │      /{id}/cancel ──────────►│── Validate: Status must be     │
  │   { reason }                 │   Pending or Confirmed only    │
  │                              │── Validate: not already        │
  │                              │   Cancelled/Completed/Rejected │
  │                              │── Set CancelledBy enum         │
  │                              │── Set CancellationReason       │
  │                              │── Update Status → Cancelled ──►│
  │                              │── Insert StatusHistory row ────►│
  │◄── 200 { updatedConsultation}│                                │
```

**Rules:**
- `InProgress`, `Completed`, `Rejected`, and `NoShow` consultations **cannot** be cancelled
- `CancellationReason` is required
- `CancelledBy` is derived from the authenticated user's role: Patient / Doctor / Admin
- Once `Cancelled`, the consultation row is immutable — no further status transitions
- Cancellation timestamps (`UpdatedAt`) are preserved for SLA and policy enforcement

---

## 5. Status Transition Rules

Every valid status transition is listed below. Any transition not in this table must be rejected at the service layer with a `400 Bad Request`.

| Current Status | Allowed Next Status | Who Can Trigger |
|---|---|---|
| `Pending` | `Confirmed` | Doctor |
| `Pending` | `Rejected` | Doctor |
| `Pending` | `Cancelled` | Patient, Doctor, Admin |
| `Confirmed` | `InProgress` | Doctor |
| `Confirmed` | `Cancelled` | Patient, Doctor, Admin |
| `Confirmed` | `NoShow` | Doctor, Admin |
| `InProgress` | `Completed` | Doctor |
| `Completed` | *(terminal)* | — |
| `Rejected` | *(terminal)* | — |
| `Cancelled` | *(terminal)* | — |
| `NoShow` | *(terminal)* | — |

**Every transition must:**
1. Validate current `Status` matches the expected source state
2. Validate the requesting user's role has permission for the target transition
3. Persist the new `Status` to `Consultations`
4. Insert a new row into `ConsultationStatusHistories`

---

## 6. Validation Rules

### Booking-Time Validations

| Rule | Description |
|---|---|
| Doctor must be Approved | `Doctors.ApprovalStatus = Approved` required; booking against a Pending/Rejected/Suspended doctor is rejected |
| Doctor must be publicly visible | `Doctors.IsPubliclyVisible = true`; this flag combines Approved + IsProfileCompleted |
| No past-date booking | `ScheduledDate + StartTime` must be in the future at time of booking |
| No double booking (patient) | A patient cannot have two active (`Pending` or `Confirmed`) consultations with the same doctor on the same date at the same time |
| No slot conflict (doctor) | If `AvailabilityId` is provided, the referenced slot must not already be linked to a `Pending` or `Confirmed` consultation |
| Symptoms required | `Symptoms` is a mandatory field at booking; empty or whitespace is rejected |
| ConsultationType required | Must be a valid enum value (`Video` or `InPerson`) |
| Fee must be positive | `Doctors.ConsultationFee` must be > 0 at snapshot time |

### Post-Booking Validations

| Rule | Description |
|---|---|
| Status immutability | Terminal states (`Completed`, `Cancelled`, `Rejected`, `NoShow`) cannot be transitioned further |
| Doctor-only transitions | `Confirm`, `Reject`, `InProgress`, `Complete`, `NoShow` can only be triggered by the owning doctor or an Admin |
| Patient-only cancellation scope | Patient can cancel only their own consultations |
| InProgress start window | Doctor may only start a session within a reasonable window of the scheduled time (business rule — enforced at service layer) |
| Notes on completion | `Notes` may be provided at completion but are not mandatory at MVP |

---

## 7. Future Video Consultation Flow

> These fields are schema-ready but the full video session implementation is a future module.

```
[Status transitions to InProgress]
        │
        ▼
  MeetingRoomId generated (video platform SDK)
  MeetingLink generated and stored
  MeetingStartedAt stamped
        │
        ▼
  Patient + Doctor join via MeetingLink
  (Frontend: /consultation/video/[roomId])
        │
        ▼
  [Doctor ends session]
  MeetingEndedAt stamped
  Status → Completed
```

**Data points captured for future use:**

| Field | Used For |
|---|---|
| `MeetingRoomId` | Video platform room identity; used to generate tokens |
| `MeetingLink` | Shared with both parties; opens the in-app video page |
| `MeetingStartedAt` | Actual session start for SLA measurement and billing |
| `MeetingEndedAt` | Actual session end; used to calculate session duration |

---

## 8. Follow-Up Consultation Flow

**Trigger:** Patient books a new consultation after a `Completed` session with the same doctor.

```
Patient                         API
  │                              │
  │── POST /api/consultations ──►│── Validate: ParentConsultationId exists
  │   { ..., isFollowUp: true,   │── Validate: Parent status = Completed
  │     parentConsultationId }   │── Validate: ParentConsultation.DoctorId
  │                              │   matches DoctorId in new booking
  │                              │── Set IsFollowUp = true
  │                              │── Set ParentConsultationId
  │                              │── Normal booking flow proceeds
  │◄── 201 { consultation } ─────│
```

**Rules:**
- `ParentConsultationId` must reference a `Completed` consultation
- The `DoctorId` in the follow-up booking must match the parent consultation's `DoctorId`
- Follow-up consultations go through the full `Pending → Confirmed → InProgress → Completed` lifecycle independently
- Follow-up chain can be traversed via `ParentConsultationId` for full patient history

