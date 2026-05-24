# Doctor Module — Business Flow Specification

> **Module:** Doctor  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-24

---

## 1. Doctor Onboarding Flow

**Trigger:** User registers on the platform and selects role = `Doctor`

```
Doctor                        API (Auth Module)              API (Doctor Module)
  │                                │                               │
  │── POST /auth/register ────────►│                               │
  │   { name, email, password,     │── Create Users row            │
  │     role: "Doctor" }           │   (Role=Doctor, IsVerified=F) │
  │                                │── Create Doctors stub row ───►│
  │◄── 201 { userId, message } ────│   (ApprovalStatus=Pending,    │
  │                                │    IsProfileCompleted=false)  │
```

**Steps:**
1. Doctor submits registration form with name, email, password
2. Auth Module creates `Users` row with `Role = Doctor`, `IsVerified = false`
3. Doctor Module automatically creates a stub `Doctors` row with `ApprovalStatus = Pending`
4. Doctor receives confirmation — account created, awaiting profile completion
5. Doctor is prompted to complete professional profile before any access is granted

> **Note:** Doctor cannot access any protected Doctor route until `IsVerified = true` (after first login) and Admin approves the profile.

---

## 2. Doctor Login Flow

**Trigger:** Doctor opens app → enters email + password

```
Doctor                        API
  │                            │
  │── POST /auth/login ───────►│── Lookup user by email
  │   { email, password,       │── Verify: IsActive = true
  │     role: "Doctor" }       │── Verify: Role = "Doctor"
  │                            │── BCrypt password verification
  │◄── 200 { jwt, refresh } ───│── Issue JWT + RefreshToken
  │                            │
  │── GET /api/doctors/me ────►│── Validate JWT
  │                            │── Return Doctor profile + ApprovalStatus
  │◄── 200 { profile } ────────│
```

**Steps:**
1. Doctor submits email and password
2. System validates `IsActive = true` and `Role = Doctor`
3. BCrypt verification against stored `PasswordHash`
4. On success: JWT access token + refresh token issued
5. Frontend fetches `/api/doctors/me` to determine UI state:
   - `IsProfileCompleted = false` → redirect to profile completion
   - `ApprovalStatus = Pending` → show "Awaiting Approval" banner
   - `ApprovalStatus = Approved` → full dashboard access granted

---

## 3. Profile Completion Flow

**Trigger:** Doctor logs in for first time and is redirected to profile setup

```
Doctor                        API                         Database
  │                            │                              │
  │── POST /api/doctors/profile►│── Validate JWT (Doctor role) │
  │   { specialization,        │── Validate required fields    │
  │     qualification,         │── Check: profile not exists   │
  │     licenseNumber, ...}    │── Save Doctors row ──────────►│
  │                            │── Evaluate IsProfileCompleted │
  │◄── 201 { doctorProfile } ──│── Set flag if all fields full │
  │                            │                              │
  │── PUT /api/doctors/me ─────►│── Update remaining fields    │
  │   { bio, city, fee, ... }  │── Re-evaluate IsProfileCompleted
  │◄── 200 { updatedProfile } ─│                              │
```

**Required fields to set `IsProfileCompleted = true`:**
- `Specialization`
- `Qualification`
- `ExperienceYears`
- `LicenseNumber`
- `ConsultationFee`
- `City`

**Steps:**
1. Doctor fills out professional details form
2. System validates all mandatory fields
3. `LicenseNumber` uniqueness is checked at service layer
4. Profile saved; `IsProfileCompleted` evaluated automatically
5. Profile remains in `Pending` approval status — visible only to Admin
6. Admin receives notification of a new pending profile

---

## 4. Admin Approval Flow

**Trigger:** Admin reviews doctor profile in Admin dashboard

```
Admin                         API (Admin Module)            Doctor Module
  │                                │                              │
  │── GET /api/admin/doctors/pending►│── Return all Pending doctors│
  │◄── 200 { doctors[] } ──────────│                              │
  │                                │                              │
  │── PUT /api/admin/doctors/{id}/approve
  │   or                          │── Validate Admin role        │
  │── PUT /api/admin/doctors/{id}/reject
  │                                │── Update ApprovalStatus ────►│
  │◄── 200 { message } ────────────│── Set IsPubliclyVisible=true │
  │                                │   (if Approved + Completed)  │
```

**Steps:**
1. Admin opens pending doctor list
2. Admin reviews profile: license number, qualifications, specialization
3. Admin approves → `ApprovalStatus = Approved`, `IsPubliclyVisible = true` (if profile complete)
4. Admin rejects → `ApprovalStatus = Rejected`, `IsPubliclyVisible = false`
5. Doctor receives notification of approval or rejection outcome
6. Rejected doctor can update profile and re-submit for review

---

## 5. Availability Management Flow

**Trigger:** Approved doctor configures consultation schedule

```
Doctor                        API                         Database
  │                            │                              │
  │── POST /api/doctors/availability
  │   { dayOfWeek: 1,          │── Validate JWT (Doctor role) │
  │     startTime: "09:00",    │── Validate: Approved doctor  │
  │     endTime: "13:00",      │── Validate: start < end      │
  │     slotDuration: 30 }     │── Save availability row ────►│
  │◄── 201 { slot } ───────────│                              │
  │                            │                              │
  │── GET /api/doctors/availability
  │◄── 200 { slots[] } ────────│── Return all doctor's slots  │
  │                            │                              │
  │── PUT /api/doctors/availability/{id}
  │   { isAvailable: false }   │── Toggle slot on/off ───────►│
  │◄── 200 { updated } ────────│                              │
```

**Business rules:**
- Only `Approved` doctors can set availability
- Multiple slots per day are allowed (e.g., 09:00–13:00 and 17:00–20:00 on Monday)
- Setting `IsAvailable = false` disables a slot without deleting the schedule entry
- The Consultation Module reads these slots when generating bookable time windows

---

## 6. Public Doctor Discoverability Flow

**Trigger:** Patient searches for a doctor

```
Patient (Unauthenticated)     API
  │                            │
  │── GET /api/doctors ────────►│── No auth required
  │   ?city=Mumbai              │── Filter: IsPubliclyVisible=true
  │   &specialization=Cardio    │── Apply city + specialization filter
  │   &language=Hindi           │── Apply language filter
  │                             │── Return paginated doctor list
  │◄── 200 { doctors[], meta } ─│   (sanitized public fields only)
  │                            │
  │── GET /api/doctors/{id} ───►│── No auth required
  │                             │── Validate IsPubliclyVisible=true
  │◄── 200 { doctorDetail,     │── Return profile + availability
  │          availability[] } ──│   (no private fields exposed)
```

**Visibility rule:**
> A doctor appears in public search **only when:**
> - `ApprovalStatus = Approved`
> - `IsProfileCompleted = true`
> - `DeletedAt = NULL`
> - `IsPubliclyVisible = true`

**Fields returned in public listing (sanitized):**
- Name (from `Users.FullName`), Specialization, Qualification, ExperienceYears
- ConsultationFee, Rating, TotalReviews, City, Languages, ProfileImageUrl
- Availability slots for the current week

