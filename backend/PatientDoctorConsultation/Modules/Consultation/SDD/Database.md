# Consultation Module — Database Schema Specification

> **Module:** Consultation  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-24

---

## 1. Overview

The Consultation Module owns two tables: `Consultations` and `ConsultationStatusHistories`.

**Design principles applied:**
- Consultation Module is a cross-module aggregator — it references `Patients` and `Doctors` via foreign keys but does not own their data
- Fee is snapshotted at booking time to decouple consultation history from doctor profile changes
- Full audit trail via `ConsultationStatusHistories` — no status change goes untracked
- Soft delete via `DeletedAt` — consultations are never hard-deleted (legal and medical record compliance)
- Video consultation fields are nullable at MVP; populated only when `ConsultationType = Video`
- Self-referencing `ParentConsultationId` supports follow-up consultation chains

---

## 2. Enums

### ConsultationStatus

| Value | Description |
|-------|-------------|
| `Pending` | Booking submitted by patient; awaiting doctor response |
| `Confirmed` | Doctor has accepted the booking |
| `Rejected` | Doctor has declined the booking |
| `Cancelled` | Cancelled by patient, doctor, or admin before session start |
| `InProgress` | Active consultation session in progress |
| `Completed` | Consultation successfully concluded |
| `NoShow` | Patient did not attend the confirmed appointment |

> **State machine:**
> ```
> Pending ──► Confirmed ──► InProgress ──► Completed
>    │             │
>    └──► Rejected └──► Cancelled
>                            ▲
>                  (from Confirmed only)
>
> Confirmed ──► NoShow  (if patient absent at scheduled time)
> ```

### ConsultationType

| Value | Description |
|-------|-------------|
| `Video` | Remote video consultation via meeting link |
| `InPerson` | Physical visit at doctor's clinic or hospital |

### CancelledBy

| Value | Description |
|-------|-------------|
| `Patient` | Patient initiated the cancellation |
| `Doctor` | Doctor cancelled the booking |
| `Admin` | Platform admin cancelled on behalf of either party |

---

## 3. Table: `Consultations`

### 3.1 Full Column Reference

| Column                    | PostgreSQL Type              | Nullable | Default               | Description |
|---------------------------|------------------------------|----------|-----------------------|-------------|
| `Id`                      | `uuid`                       | NO       | `gen_random_uuid()`   | Primary key |
| `PatientId`               | `uuid`                       | NO       | —                     | FK → `Patients.Id`; restricted delete |
| `DoctorId`                | `uuid`                       | NO       | —                     | FK → `Doctors.Id`; restricted delete |
| `AvailabilityId`          | `uuid`                       | YES      | `NULL`                | FK → `DoctorAvailabilities.Id`; nullable — may not map to a slot at MVP |
| `ConsultationNumber`      | `character varying(20)`      | NO       | —                     | Human-readable unique booking reference (e.g., `CONS-20260524-0001`) |
| `ScheduledDate`           | `date`                       | NO       | —                     | Booked date of consultation (ISO-8601) |
| `StartTime`               | `time without time zone`     | NO       | —                     | Session start time (stored in UTC) |
| `EndTime`                 | `time without time zone`     | NO       | —                     | Expected session end time (stored in UTC) |
| `TimeZone`                | `character varying(100)`     | NO       | —                     | IANA timezone of the booking (e.g., `Asia/Kolkata`) |
| `Status`                  | `character varying(50)`      | NO       | `'Pending'`           | Enum: `ConsultationStatus` |
| `ConsultationType`        | `character varying(20)`      | NO       | —                     | Enum: `Video` or `InPerson` |
| `Symptoms`                | `text`                       | NO       | —                     | Patient-reported symptoms submitted at booking |
| `Notes`                   | `text`                       | YES      | `NULL`                | Doctor's clinical notes after session |
| `CancellationReason`      | `text`                       | YES      | `NULL`                | Free-text reason; populated when status = `Cancelled` |
| `CancelledBy`             | `character varying(20)`      | YES      | `NULL`                | Enum: `CancelledBy`; nullable when not cancelled |
| `MeetingRoomId`           | `character varying(256)`     | YES      | `NULL`                | Video platform room identifier; populated for Video type |
| `MeetingLink`             | `text`                       | YES      | `NULL`                | Shareable join URL for video session |
| `MeetingStartedAt`        | `timestamp with time zone`   | YES      | `NULL`                | Actual time doctor/patient entered the meeting room |
| `MeetingEndedAt`          | `timestamp with time zone`   | YES      | `NULL`                | Actual time meeting room was closed |
| `ConsultationFeeSnapshot` | `numeric(10,2)`              | NO       | —                     | Doctor's fee at time of booking; immutable after creation |
| `IsFollowUp`              | `boolean`                    | NO       | `false`               | True if this is a follow-up to a prior consultation |
| `ParentConsultationId`    | `uuid`                       | YES      | `NULL`                | Self-FK → `Consultations.Id`; links follow-ups to their parent |
| `CreatedAt`               | `timestamp with time zone`   | NO       | `CURRENT_TIMESTAMP`   | Record creation timestamp |
| `UpdatedAt`               | `timestamp with time zone`   | NO       | `CURRENT_TIMESTAMP`   | Last modification timestamp |
| `DeletedAt`               | `timestamp with time zone`   | YES      | `NULL`                | Soft-delete timestamp; NULL = active |

---

### 3.2 Field Group Breakdown

#### Core Participants

| Field | Purpose |
|-------|---------|
| `PatientId` | References the patient who booked the consultation; `RESTRICT` on delete — consultation history must not be lost if patient is soft-deleted |
| `DoctorId` | References the doctor being consulted; `RESTRICT` on delete for same reason |
| `AvailabilityId` | Optional link to the `DoctorAvailabilities` slot; used to mark the slot as occupied and prevent double booking |

#### Booking Identity

| Field | Purpose |
|-------|---------|
| `ConsultationNumber` | Human-readable unique identifier (e.g., `CONS-20260524-0042`); displayed in patient and doctor dashboards; used for support queries and receipts |

#### Schedule Fields

| Field | Purpose |
|-------|---------|
| `ScheduledDate` | The confirmed date of consultation in ISO-8601 format |
| `StartTime` | Session start time stored in UTC; displayed in patient's local timezone using `TimeZone` field |
| `EndTime` | Expected session end time; used to calculate slot duration and detect overruns |
| `TimeZone` | IANA timezone string of the booking; ensures cross-timezone correctness when displaying scheduled time |

#### Status & Type

| Field | Purpose |
|-------|---------|
| `Status` | Drives entire consultation lifecycle state machine; transitions are validated at service layer |
| `ConsultationType` | Determines whether session is Video (meeting link required) or InPerson (address from doctor profile) |

#### Clinical Data

| Field | Purpose |
|-------|---------|
| `Symptoms` | Collected at booking time; surfaced to doctor before the session for preparation |
| `Notes` | Doctor fills this post-session; captures clinical observations, diagnosis summary, and recommendations |

#### Cancellation

| Field | Purpose |
|-------|---------|
| `CancellationReason` | Mandatory when status transitions to `Cancelled`; stored for audit |
| `CancelledBy` | Identifies which party initiated cancellation; used for platform policy enforcement (refunds, penalties) |

#### Video Consultation Fields

| Field | Purpose |
|-------|---------|
| `MeetingRoomId` | Unique room ID on the video platform; used by the frontend to join/create the room |
| `MeetingLink` | Direct join URL; shared with both patient and doctor via notification |
| `MeetingStartedAt` | Actual meeting start — compared against `ScheduledDate`/`StartTime` to measure punctuality |
| `MeetingEndedAt` | Actual meeting end — used to calculate session duration for analytics |

#### Fee Snapshot

| Field | Purpose |
|-------|---------|
| `ConsultationFeeSnapshot` | **Why this field exists:** Doctor's `ConsultationFee` in the `Doctors` table can be updated at any time. The fee snapshot locks in the fee agreed upon at booking, so billing, refunds, and audit records remain accurate regardless of future doctor profile changes. This is a standard immutable-record pattern in transactional systems. |

#### Follow-Up Chain

| Field | Purpose |
|-------|---------|
| `IsFollowUp` | Boolean flag; set to `true` when patient books a follow-up after a completed consultation |
| `ParentConsultationId` | Self-referencing FK; links the follow-up to its originating consultation. Enables consultation history chain: `Parent → FollowUp1 → FollowUp2` |

---

## 4. Table: `ConsultationStatusHistories`

### 4.1 Purpose

Every status transition on a `Consultation` row must produce an immutable `ConsultationStatusHistory` record.

**Why this table exists:** The `Consultations.Status` field holds the current state. But for a healthcare platform, regulators, doctors, patients, and the support team need to know the **full history of who changed what and when**. This table provides a tamper-evident audit log that is legally relevant (e.g., documenting when a doctor cancelled close to the scheduled time).

### 4.2 Full Column Reference

| Column            | PostgreSQL Type              | Nullable | Default               | Description |
|-------------------|------------------------------|----------|-----------------------|-------------|
| `Id`              | `uuid`                       | NO       | `gen_random_uuid()`   | Primary key |
| `ConsultationId`  | `uuid`                       | NO       | —                     | FK → `Consultations.Id`; cascade delete |
| `OldStatus`       | `character varying(50)`      | YES      | `NULL`                | Status before the transition; NULL for initial creation event |
| `NewStatus`       | `character varying(50)`      | NO       | —                     | Status after the transition |
| `ChangedByUserId` | `uuid`                       | NO       | —                     | FK → `Users.Id`; the user who triggered this transition (patient, doctor, or admin) |
| `Reason`          | `text`                       | YES      | `NULL`                | Human-readable reason; required for cancellation and rejection transitions |
| `CreatedAt`       | `timestamp with time zone`   | NO       | `CURRENT_TIMESTAMP`   | Immutable timestamp of the transition |

> `ConsultationStatusHistories` rows are **insert-only** — no updates or deletes are permitted.

---

## 5. Relationships

| Relationship | Type | FK | On Delete |
|---|---|---|---|
| `Consultations` → `Patients` | Many-to-One | `PatientId` | RESTRICT |
| `Consultations` → `Doctors` | Many-to-One | `DoctorId` | RESTRICT |
| `Consultations` → `DoctorAvailabilities` | Many-to-One | `AvailabilityId` | SET NULL |
| `Consultations` → `Consultations` (self) | Many-to-One | `ParentConsultationId` | SET NULL |
| `ConsultationStatusHistories` → `Consultations` | Many-to-One | `ConsultationId` | CASCADE |
| `ConsultationStatusHistories` → `Users` | Many-to-One | `ChangedByUserId` | RESTRICT |

---

## 6. Indexes

| Index Name | Table | Column(s) | Type | Purpose |
|---|---|---|---|---|
| `PK_Consultations` | `Consultations` | `Id` | Primary | Default PK index |
| `UQ_Consultations_ConsultationNumber` | `Consultations` | `ConsultationNumber` | Unique | Enforces human-readable booking ID uniqueness |
| `IX_Consultations_PatientId` | `Consultations` | `PatientId` | B-Tree | Patient consultation history queries |
| `IX_Consultations_DoctorId` | `Consultations` | `DoctorId` | B-Tree | Doctor schedule and pending request queries |
| `IX_Consultations_Status` | `Consultations` | `Status` | B-Tree | Filtering by status (e.g., all Pending, all Confirmed) |
| `IX_Consultations_ScheduledDate_DoctorId` | `Consultations` | `ScheduledDate`, `DoctorId` | Composite | Doctor schedule lookup for a given day |
| `IX_Consultations_DeletedAt` | `Consultations` | `DeletedAt` | Partial (WHERE NULL) | Efficiently filter soft-deleted rows |
| `PK_ConsultationStatusHistories` | `ConsultationStatusHistories` | `Id` | Primary | Default PK index |
| `IX_StatusHistories_ConsultationId` | `ConsultationStatusHistories` | `ConsultationId` | B-Tree | Retrieve full history for a consultation |

---

## 7. Soft Delete Strategy

- `Consultations.DeletedAt` is `NULL` for all active records.
- All queries include a global filter `WHERE DeletedAt IS NULL` via EF Core query filter.
- Soft-deleted consultations remain in the database indefinitely for audit, billing, and regulatory compliance.
- Hard deletes are never performed on this table.
- `ConsultationStatusHistories` has no `DeletedAt` — these rows are append-only and immutable.

