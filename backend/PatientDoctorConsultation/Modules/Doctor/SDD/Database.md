# Doctor Module — Database Schema Specification

> **Module:** Doctor  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-24

---

## 1. Overview

The Doctor Module owns two tables: `Doctors` and `DoctorAvailabilities`.

**Design principles applied:**
- Clean separation from Auth — no authentication fields in `Doctors` table
- All identity and credential data lives in `Users` table (Auth Module)
- `Doctors` row is created post-registration, completed during onboarding
- Availability stored as recurring weekly slots (not calendar-based at MVP)
- Soft delete via `DeletedAt` on `Doctors` only

---

## 2. Table: `Doctors`

### 2.1 Full Column Reference

| Column                | PostgreSQL Type              | Nullable | Default               | Description |
|-----------------------|------------------------------|----------|-----------------------|-------------|
| `Id`                  | `uuid`                       | NO       | `gen_random_uuid()`   | Primary key |
| `UserId`              | `uuid`                       | NO       | —                     | FK → `Users.Id`; one-to-one |
| `Specialization`      | `character varying(256)`     | YES      | `NULL`                | e.g., Cardiologist, Dermatologist |
| `Qualification`       | `character varying(512)`     | YES      | `NULL`                | e.g., MBBS, MD, DNB |
| `ExperienceYears`     | `integer`                    | YES      | `NULL`                | Years of clinical experience |
| `LicenseNumber`       | `character varying(100)`     | YES      | `NULL`                | Medical council license; unique |
| `Bio`                 | `text`                       | YES      | `NULL`                | Professional summary (max 1000 chars enforced at app layer) |
| `ProfileImageUrl`     | `text`                       | YES      | `NULL`                | CDN / storage URL for profile photo |
| `ConsultationFee`     | `numeric(10,2)`              | YES      | `NULL`                | Fee in platform base currency |
| `HospitalName`        | `character varying(256)`     | YES      | `NULL`                | Affiliated hospital or clinic name |
| `ClinicAddress`       | `character varying(512)`     | YES      | `NULL`                | Full address string |
| `City`                | `character varying(100)`     | YES      | `NULL`                | City of practice |
| `State`               | `character varying(100)`     | YES      | `NULL`                | State / Province |
| `Country`             | `character varying(100)`     | YES      | `NULL`                | Country code or full name |
| `LanguagesSpoken`     | `text[]`                     | YES      | `NULL`                | PostgreSQL array — e.g., `{English, Hindi}` |
| `ApprovalStatus`      | `character varying(50)`      | NO       | `'Pending'`           | Enum: `Pending`, `Approved`, `Rejected`, `Suspended` |
| `Rating`              | `numeric(3,2)`               | YES      | `NULL`                | Aggregated average rating (0.00 – 5.00) |
| `TotalReviews`        | `integer`                    | NO       | `0`                   | Total review count; updated by Consultation module |
| `TotalConsultations`  | `integer`                    | NO       | `0`                   | Lifetime completed consultations |
| `IsProfileCompleted`  | `boolean`                    | NO       | `false`               | True once all required profile fields are filled |
| `IsPubliclyVisible`   | `boolean`                    | NO       | `false`               | True only when `Approved` AND `IsProfileCompleted = true` |
| `CreatedAt`           | `timestamp with time zone`   | NO       | `CURRENT_TIMESTAMP`   | Record creation time |
| `UpdatedAt`           | `timestamp with time zone`   | NO       | `CURRENT_TIMESTAMP`   | Last modification time |
| `DeletedAt`           | `timestamp with time zone`   | YES      | `NULL`                | Soft-delete timestamp; NULL = active |

---

### 2.2 Field Group Breakdown

#### Identity Link

| Field    | Purpose |
|----------|---------|
| `UserId` | One-to-one FK to `Users.Id`; doctor profile is anchored to a platform user account; cascade delete not applied — doctor profiles are soft-deleted independently |

#### Professional Profile Fields

| Field             | Purpose |
|-------------------|---------|
| `Specialization`  | Medical specialty — used for patient search filters and discovery |
| `Qualification`   | Degrees and credentials displayed on public profile |
| `ExperienceYears` | Years of practice — displayed on public listing card |
| `LicenseNumber`   | Verified by Admin during approval; unique constraint enforced |
| `Bio`             | Free-text professional summary shown on doctor detail page |

#### Practice Location Fields

| Field           | Purpose |
|-----------------|---------|
| `HospitalName`  | Affiliated institution; shown on public listing card |
| `ClinicAddress` | Full address for in-person consultation context |
| `City`          | Used for location-based search and filter |
| `State`         | Supports regional filtering |
| `Country`       | Multi-country support at data layer |

#### Consultation Metadata

| Field              | Purpose |
|--------------------|---------|
| `ConsultationFee`  | Used in booking flow — displayed to patient before confirmation |
| `LanguagesSpoken`  | Array — patient can filter by language preference |
| `ProfileImageUrl`  | CDN URL — uploaded via storage service; URL persisted here |

#### Approval & Visibility

| Field                | Purpose |
|----------------------|---------|
| `ApprovalStatus`     | Admin-controlled state machine; drives entire doctor lifecycle |
| `IsProfileCompleted` | Set to `true` when all mandatory fields are present; checked at profile update |
| `IsPubliclyVisible`  | Derived rule: only `Approved` + `IsProfileCompleted = true` doctors appear in patient search |

> **ApprovalStatus state transitions:**
> ```
> [Registration]
>      │
>      ▼
>   Pending ──── Admin Approves ──► Approved ──── Admin Suspends ──► Suspended
>      │
>      └──── Admin Rejects ──► Rejected
>                                  │
>                          (Doctor can resubmit profile)
> ```

#### Engagement Metrics

| Field               | Purpose |
|---------------------|---------|
| `Rating`            | Calculated and updated by Consultation Module on review submission |
| `TotalReviews`      | Incremented by Consultation Module; read-only in Doctor Module |
| `TotalConsultations`| Incremented on session completion; read-only in Doctor Module |

---

### 2.3 Indexes

| Index Name                        | Column(s)                    | Type   | Reason |
|-----------------------------------|------------------------------|--------|--------|
| `PK_Doctors`                      | `Id`                         | PK     | Primary lookup |
| `UQ_Doctors_UserId`               | `UserId`                     | UNIQUE | One profile per user |
| `UQ_Doctors_LicenseNumber`        | `LicenseNumber`              | UNIQUE | License uniqueness enforcement |
| `IX_Doctors_ApprovalStatus`       | `ApprovalStatus`             | B-Tree | Admin dashboard filtering |
| `IX_Doctors_City_Specialization`  | `City`, `Specialization`     | B-Tree | Patient discovery search performance |
| `IX_Doctors_IsPubliclyVisible`    | `IsPubliclyVisible`          | B-Tree | Public listing query optimization |

---

## 3. Table: `DoctorAvailabilities`

### 3.1 Full Column Reference

| Column                | PostgreSQL Type            | Nullable | Default               | Description |
|-----------------------|----------------------------|----------|-----------------------|-------------|
| `Id`                  | `uuid`                     | NO       | `gen_random_uuid()`   | Primary key |
| `DoctorId`            | `uuid`                     | NO       | —                     | FK → `Doctors.Id`; cascade delete |
| `DayOfWeek`           | `integer`                  | NO       | —                     | 0 = Sunday … 6 = Saturday |
| `StartTime`           | `time without time zone`   | NO       | —                     | Slot window start (e.g., `09:00`) |
| `EndTime`             | `time without time zone`   | NO       | —                     | Slot window end (e.g., `13:00`) |
| `SlotDurationMinutes` | `integer`                  | NO       | `30`                  | Consultation duration per booking slot |
| `IsAvailable`         | `boolean`                  | NO       | `true`                | Toggle slot on/off without deletion |
| `CreatedAt`           | `timestamp with time zone` | NO       | `CURRENT_TIMESTAMP`   | Record creation time |

---

### 3.2 Business Rules

- A doctor can have **multiple rows per DayOfWeek** (e.g., morning + evening slots on same day)
- `StartTime` must always be **before** `EndTime` — enforced at service layer
- `SlotDurationMinutes` defines booking granularity — `30` means 30-min appointment windows
- `IsAvailable = false` hides the slot from the booking engine without hard deletion
- Cascade delete: removing a `Doctors` record removes all their availability rows

### 3.3 Indexes

| Index Name                              | Column(s)               | Type   | Reason |
|-----------------------------------------|-------------------------|--------|--------|
| `PK_DoctorAvailabilities`               | `Id`                    | PK     | Primary lookup |
| `IX_DoctorAvailabilities_DoctorId`      | `DoctorId`              | B-Tree | Fast per-doctor schedule fetch |
| `IX_DoctorAvailabilities_DayOfWeek`     | `DoctorId`, `DayOfWeek` | B-Tree | Weekly schedule query |

---

## 4. Entity Relationships

```
Users (Auth Module)
  │
  │  1 : 1
  ▼
Doctors
  │
  │  1 : N
  ▼
DoctorAvailabilities
```

> `Doctors.UserId` references `Users.Id` with a **restricted FK** — deleting a User does not cascade-delete the Doctor record. Soft delete is applied at the application layer via `DeletedAt`.

---

## 5. EF Core Mapping Notes

| Concern | Mapping |
|---------|---------|
| `ApprovalStatus` | `string` with `HasConversion<string>()` or value object enum |
| `LanguagesSpoken` | `List<string>` mapped with `HasColumnType("text[]")` |
| `Rating` | `decimal` with `HasPrecision(3, 2)` |
| `ConsultationFee` | `decimal` with `HasPrecision(10, 2)` |
| `UpdatedAt` | Auto-updated via shared `SaveChangesInterceptor` |
| Soft delete | Global query filter: `.HasQueryFilter(d => d.DeletedAt == null)` |

