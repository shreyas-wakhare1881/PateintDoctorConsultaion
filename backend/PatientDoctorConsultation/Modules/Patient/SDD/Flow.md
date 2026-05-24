# Patient Module — Business Flow Specification

> **Module:** Patient  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-24

---

## 1. Patient Onboarding Flow

**Trigger:** New user opens the app and selects role = `Patient` (OTP-based login auto-creates the user)

```
Patient                       API (Auth Module)              API (Patient Module)
  │                                │                               │
  │── POST /auth/send-otp ────────►│── Lookup or create User       │
  │   { email }                    │   (Role=Patient, IsActive=T)  │
  │◄── 200 { otpReference } ───────│                               │
  │                                │                               │
  │── POST /auth/verify-otp ──────►│── Validate OTP                │
  │   { email, otp }               │── Issue JWT + RefreshToken    │
  │◄── 200 { jwt, refresh } ───────│                               │
  │                                │                               │
  │── POST /api/patients/profile ─►│               ── Validate JWT │
  │   { gender, dateOfBirth,       │                  (Patient role)│
  │     bloodGroup, city, ... }    │                  Save Patients │
  │◄── 201 { patientProfile } ─────│               ── row          │
```

**Steps:**
1. Patient enters email; OTP is dispatched to that email address
2. Patient submits OTP; system issues a JWT access token and refresh token
3. If `Patient` record does not exist for this `UserId`, frontend redirects to onboarding screen
4. Patient fills health profile form and submits `POST /api/patients/profile`
5. System creates the `Patients` row; `IsProfileCompleted` is evaluated automatically
6. Patient can now browse doctors and initiate bookings (once Consultation Module is active)

> **Note:** Unlike the Doctor Module, patients are NOT subject to admin approval. A verified OTP is sufficient to begin using the platform.

---

## 2. Patient Login Flow

**Trigger:** Returning patient opens the app

```
Patient                       API
  │                            │
  │── POST /auth/send-otp ────►│── Lookup User by email
  │   { email }                │── Verify: Role = "Patient"
  │◄── 200 { otpReference } ───│── Dispatch OTP via email/SMS
  │                            │
  │── POST /auth/verify-otp ──►│── Validate OTP (time-bound, single use)
  │   { email, otp }           │── Issue JWT + RefreshToken
  │◄── 200 { jwt, refresh } ───│
  │                            │
  │── GET /api/patients/me ───►│── Validate JWT
  │                            │── Return Patient profile
  │◄── 200 { profile }  ───────│
```

**Steps:**
1. Patient requests OTP via registered email
2. System validates the OTP (time-limited, single-use)
3. On success: JWT + refresh token issued
4. Frontend calls `GET /api/patients/me`:
   - If `IsProfileCompleted = false` → redirect to profile completion screen
   - If `IsProfileCompleted = true` → proceed to patient dashboard

---

## 3. Profile Completion Flow

**Trigger:** Patient logs in and `IsProfileCompleted = false`

```
Patient                       API                         Database
  │                            │                              │
  │── PUT /api/patients/me ───►│── Validate JWT (Patient role)│
  │   { gender, dateOfBirth,   │── Validate fields            │
  │     bloodGroup, city,      │── Update Patients row ──────►│
  │     allergies, ... }       │── Re-evaluate                │
  │◄── 200 { updatedProfile } ─│   IsProfileCompleted         │
```

**Required fields to set `IsProfileCompleted = true`:**

| Field         | Reason |
|---------------|--------|
| `Gender`      | Medically relevant for consultation context |
| `DateOfBirth` | Age is required by most doctors and specialties |
| `BloodGroup`  | Critical for emergency scenarios |
| `City`        | Minimum location context for relevant recommendations |

**Steps:**
1. Patient is shown an onboarding screen listing incomplete fields
2. Patient fills mandatory fields and submits
3. System updates the `Patients` row
4. `IsProfileCompleted` is re-evaluated — set to `true` if all required fields are present
5. Patient is redirected to the dashboard on completion

---

## 4. Consultation Readiness Flow

**Trigger:** Patient wants to book a consultation

```
Patient                       API                         Consultation Module
  │                            │                              │
  │── GET /api/patients/doctors►│── No auth required           │
  │   ?city=Pune               │── Filter: Approved doctors   │
  │   &specialization=Cardio   │── Return paginated list       │
  │◄── 200 { doctors[] } ──────│                              │
  │                            │                              │
  │── GET /api/doctors/{id} ──►│── No auth required           │
  │◄── 200 { doctorDetail,     │── Return full profile +      │
  │          availability[] } ─│   availability slots         │
  │                            │                              │
  │── POST /api/consultations ─►│               ── Validate JWT│
  │   (future)                 │               ── Check       │
  │                            │                  IsProfileCompleted│
```

**Steps:**
1. Patient browses doctor listing (no authentication required)
2. Patient views doctor detail and available slots
3. Patient selects a slot and proceeds to book
4. System validates:
   - Patient JWT is valid
   - `IsProfileCompleted = true` (profile must be complete before booking)
5. Booking created in Consultation Module (out of scope for this module)

> **Gate:** A patient with `IsProfileCompleted = false` cannot initiate a consultation booking.

---

## 5. Patient Data Privacy Flow

**Trigger:** Any request that touches patient health data

```
Request                       Middleware / Auth              Patient Module
  │                                │                               │
  │── Any /api/patients/* ────────►│── JWT required                │
  │                                │── Claims extracted            │
  │                                │── UserId from JWT claim ─────►│
  │                                │                               │── Scope query to UserId
  │                                │                               │── Never return other patients' data
  │◄── 200 { own profile only } ───│◄──────────────────────────────│
```

**Rules enforced at service layer:**
1. Patient can only access their own profile (`UserId` from JWT claim binds all queries)
2. No endpoint returns a list of patient profiles (no `GET /api/patients` admin-style listing at Patient Module level)
3. Medical fields (`Allergies`, `ChronicDiseases`, `BloodGroup`) are never returned on any public endpoint
4. Soft-deleted patients are filtered via global EF query filter — invisible to all queries
5. Doctor module public endpoints never include any patient data in their responses

---

## 6. Soft Delete Flow

**Trigger:** Patient requests account deletion

```
Patient                       API                         Database
  │                            │                              │
  │── DELETE /api/patients/me ►│── Validate JWT               │
  │                            │── Verify ownership           │
  │                            │── Set DeletedAt = UtcNow ───►│
  │◄── 200 { message } ────────│   (IsProfileCompleted = false│
  │                            │    if needed for audit)      │
```

**Steps:**
1. Patient submits account deletion request
2. System sets `DeletedAt = UTC timestamp` on the `Patients` row
3. Global EF query filter (`DeletedAt == null`) excludes this record from all future queries
4. JWT tokens for this user will continue to work for their remaining lifetime
5. `Users` record is NOT deleted — user can re-register a new patient profile if needed

> **Data Retention:** Soft-deleted records are retained for audit and compliance. A background purge job (future) may hard-delete records after the mandated retention period.

