# Patient Module — Database Schema Specification

> **Module:** Patient  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-24

---

## 1. Overview

The Patient Module owns a single table: `Patients`.

**Design principles applied:**
- Clean separation from Auth — no authentication fields in `Patients` table
- All identity data (email, password, role, tokens) lives in `Users` table (Auth Module)
- Patient profile is created post-login during onboarding; never auto-created at registration
- Medical data is stored as free-text fields at MVP — structured in future iterations
- Soft delete via `DeletedAt` — patient data is never hard-deleted (GDPR compliance)
- Patient data is strictly private — no public exposure at any endpoint

---

## 2. Table: `Patients`

### 2.1 Full Column Reference

| Column                   | PostgreSQL Type              | Nullable | Default             | Description |
|--------------------------|------------------------------|----------|---------------------|-------------|
| `Id`                     | `uuid`                       | NO       | `gen_random_uuid()` | Primary key |
| `UserId`                 | `uuid`                       | NO       | —                   | FK → `Users.Id`; one-to-one |
| `Gender`                 | `character varying(20)`      | YES      | `NULL`              | `Male`, `Female`, `Other`, `PreferNotToSay` |
| `DateOfBirth`            | `date`                       | YES      | `NULL`              | ISO-8601 date; age calculated at app layer |
| `BloodGroup`             | `character varying(10)`      | YES      | `NULL`              | e.g., `A+`, `O-`, `AB+` |
| `HeightCm`               | `integer`                    | YES      | `NULL`              | Height in centimetres |
| `WeightKg`               | `numeric(5,2)`               | YES      | `NULL`              | Weight in kilograms (e.g., `72.50`) |
| `Allergies`              | `text`                       | YES      | `NULL`              | Free-text allergy description |
| `ChronicDiseases`        | `text`                       | YES      | `NULL`              | Free-text chronic condition list |
| `EmergencyContactName`   | `character varying(150)`     | YES      | `NULL`              | Name of emergency contact person |
| `EmergencyContactPhone`  | `character varying(20)`      | YES      | `NULL`              | Phone with country code (e.g., `+919999999999`) |
| `Address`                | `character varying(512)`     | YES      | `NULL`              | Street or locality address |
| `City`                   | `character varying(100)`     | YES      | `NULL`              | City of residence |
| `State`                  | `character varying(100)`     | YES      | `NULL`              | State / Province |
| `Country`                | `character varying(100)`     | YES      | `NULL`              | Country name or code |
| `ProfileImageUrl`        | `text`                       | YES      | `NULL`              | CDN / storage URL for patient profile photo |
| `IsProfileCompleted`     | `boolean`                    | NO       | `false`             | True once required health profile fields are filled |
| `CreatedAt`              | `timestamp with time zone`   | NO       | `CURRENT_TIMESTAMP` | Record creation timestamp |
| `UpdatedAt`              | `timestamp with time zone`   | YES      | `NULL`              | Last modification timestamp |
| `DeletedAt`              | `timestamp with time zone`   | YES      | `NULL`              | Soft-delete timestamp; NULL = active |

---

### 2.2 Field Group Breakdown

#### Identity Link

| Field    | Purpose |
|----------|---------|
| `UserId` | One-to-one FK to `Users.Id`; patient profile is anchored to a platform user account. A user with `Role = Patient` can have exactly one patient profile. |

#### Basic Health Fields

| Field         | Purpose |
|---------------|---------|
| `Gender`      | Displayed on profile; used in medical context during consultations |
| `DateOfBirth` | Stored as date; age is calculated at application layer when needed |
| `BloodGroup`  | Critical for emergency consultations; displayed on profile summary |

#### Physical Metrics

| Field       | Purpose |
|-------------|---------|
| `HeightCm`  | Used to calculate BMI at application layer (future AI health analytics) |
| `WeightKg`  | Numeric with 2 decimal places for accurate BMI calculation |

#### Medical Information

| Field              | Purpose |
|--------------------|---------|
| `Allergies`        | Free-text — captured to surface in consultation context for doctor visibility |
| `ChronicDiseases`  | Free-text — e.g., "Type 2 Diabetes, Hypertension"; doctor sees during consultation |

> **MVP Note:** Allergies and ChronicDiseases are free-text at this stage. Future iterations will replace these with structured multi-select data.

#### Emergency Contact

| Field                   | Purpose |
|-------------------------|---------|
| `EmergencyContactName`  | Name of next-of-kin or trusted contact |
| `EmergencyContactPhone` | Phone number with country code; validated at app layer |

#### Location

| Field     | Purpose |
|-----------|---------|
| `Address` | Street-level address for in-clinic consultation context |
| `City`    | Used for location-relevant doctor recommendations (future feature) |
| `State`   | Regional context |
| `Country` | Multi-country support at data layer |

#### Profile Metadata

| Field                | Purpose |
|----------------------|---------|
| `ProfileImageUrl`    | CDN URL — uploaded via storage service |
| `IsProfileCompleted` | Evaluated when mandatory fields are all present; enables consultation booking |

---

### 2.3 Profile Completion Rule

`IsProfileCompleted` is set to `true` when all of the following fields are non-null and non-empty:

| Required Field | Reason |
|----------------|--------|
| `Gender`       | Medically relevant context |
| `DateOfBirth`  | Age is required for most consultations |
| `BloodGroup`   | Critical for emergency medical context |
| `City`         | Minimum location for relevant doctor discovery |

> All other fields are optional additions that improve the healthcare experience.

---

### 2.4 Indexes

| Index Name                  | Column(s)    | Type   | Reason |
|-----------------------------|--------------|--------|--------|
| `PK_Patients`               | `Id`         | PK     | Primary lookup |
| `UQ_Patients_UserId`        | `UserId`     | UNIQUE | One profile per user account |
| `IX_Patients_DeletedAt`     | `DeletedAt`  | B-Tree | Global query filter support for soft-delete |

> No public search indexes are needed — patient data is never queried publicly.

---

## 3. Entity Relationships

```
Users (Auth Module)
  │
  │  1 : 1
  ▼
Patients
```

> `Patients.UserId` references `Users.Id` with a **restricted FK** — deleting a User does not cascade-delete the Patient record. Soft delete is applied at the application layer via `DeletedAt`.

---

## 4. Data Privacy Notes

| Concern | Rule |
|---------|------|
| No public queries | `Patients` table is never joined into any public-facing endpoint |
| Auth fields excluded | `Email`, `PasswordHash`, `Role`, `RefreshTokens` are stored in `Users` only |
| Age not stored | Only `DateOfBirth` stored; age calculated on demand |
| Soft delete only | `DeletedAt` timestamp used; hard delete is not permitted |
| No cross-patient access | Patients can only read their own profile via JWT claim binding |

---

## 5. EF Core Mapping Notes

| Concern | Mapping |
|---------|---------|
| `WeightKg` | `decimal` with `HasPrecision(5, 2)` |
| `UpdatedAt` | Auto-updated via shared `SaveChangesInterceptor` |
| Soft delete | Global query filter: `.HasQueryFilter(p => p.DeletedAt == null)` |
| `DateOfBirth` | Mapped as `DateOnly` in C# entity with `HasColumnType("date")` |
