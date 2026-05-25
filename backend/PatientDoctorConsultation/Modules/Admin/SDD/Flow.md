# Admin Module — Business Flow Specification

> **Module:** Admin  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-25

---

## 1. Actor Context

The Admin is a **governance operator**, not a healthcare actor. Admins do not create consultations, prescribe medication, or interact with patients medically. Their function is platform moderation, provider verification, and operational oversight.

| Actor | Login Method | Seeded | Registration API |
|-------|-------------|--------|-----------------|
| Admin | Email + Password | YES — at system startup | NONE — no public register |

---

## 2. Seeded Admin Startup Flow

**Trigger:** Application starts (Program.cs / startup pipeline)

```
Application Startup
  │
  ├── Run EF Core Migrations
  │
  ├── Execute Admin Seed Service
  │     │
  │     ├── Read ADMIN_EMAIL from environment
  │     ├── Read ADMIN_PASSWORD from environment
  │     │
  │     ├── SELECT FROM Users WHERE Email = ADMIN_EMAIL
  │     │
  │     ├── [EXISTS] → DO NOTHING (UPSERT — no duplicate created)
  │     │
  │     └── [NOT EXISTS] → INSERT Users row
  │           Role = Admin
  │           IsActive = true
  │           IsVerified = true
  │           PasswordHash = BCrypt(ADMIN_PASSWORD)
  │
  └── Application ready → Admin can login
```

**Business rules:**
- Admin seed runs on every startup — idempotent by design
- `ON CONFLICT (Email) DO NOTHING` prevents duplicate admin records
- Password seeded as BCrypt hash (cost factor 12) — never stored as plain text
- Credentials sourced exclusively from environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- Default seeded password **must be rotated on first production deployment**

---

## 3. Admin Login Flow

**Trigger:** Admin opens platform → enters email + password

```
Admin                       API (Auth Module)               Database
  │                               │                              │
  │── POST /api/auth/login ──────►│── Lookup user by email ─────►│
  │   { email, password,          │◄── User row returned ────────│
  │     role: "Admin" }           │── Validate: IsActive = true  │
  │                               │── Validate: Role = "Admin"   │
  │                               │── BCrypt.Verify(password,    │
  │                               │     PasswordHash)            │
  │                               │── Generate JWT (role=Admin)  │
  │                               │── Generate RefreshToken      │
  │                               │── Save hashed RefreshToken ─►│
  │◄── 200 { jwt, refresh } ──────│                              │
  │                               │                              │
  │── GET /api/admin/dashboard ──►│── Validate JWT (Admin role)  │
  │◄── 200 { stats } ─────────────│── Return aggregated stats    │
```

**Steps:**
1. Admin submits email and password via the standard `/api/auth/login` endpoint
2. System validates `Role = Admin` and `IsActive = true`
3. BCrypt verification against stored `PasswordHash`
4. On success: JWT with `role=Admin` claim issued; refresh token pair stored
5. Frontend uses JWT to access all `/api/admin/*` routes

---

## 4. Doctor Approval Flow

**Trigger:** Doctor registers and completes their professional profile

```
Doctor Profile (Pending)       Admin                       API (Admin Module)
  │                              │                               │
  │                              │── GET /api/admin/doctors/pending
  │                              │◄── 200 { doctors[] } ────────│
  │                              │   (ApprovalStatus = Pending)  │
  │                              │                               │
  │                              │── PUT /api/admin/doctors/{id}/approve
  │                              │   { reason? }                 │
  │                              │                               │── Validate: JWT Admin role
  │                              │                               │── Load Doctor by id
  │                              │                               │── Set ApprovalStatus = Approved
  │                              │                               │── Set IsPubliclyVisible = true
  │                              │                               │──   (if IsProfileCompleted = true)
  │                              │                               │── Create AdminAuditLog
  │                              │                               │   ActionType = DoctorApproved
  │◄── Doctor now visible ────────────────────────────────────────│
  │    to patients                                               │
```

**Rejection path:**
```
Admin── PUT /api/admin/doctors/{id}/reject
        { reason: "License number could not be verified" }
        │
        ├── Set ApprovalStatus = Rejected
        ├── Set IsPubliclyVisible = false
        └── Create AdminAuditLog (ActionType = DoctorRejected)
```

**Business rules:**
- Only doctors with `ApprovalStatus = Pending` appear in the pending list
- Rejected doctor can update their profile and resubmit — `ApprovalStatus` returns to `Pending`
- `IsPubliclyVisible = true` is set **only** when `Approved AND IsProfileCompleted = true`
- Audit log entry created for every approval or rejection action

---

## 5. Doctor Suspension Flow

**Trigger:** Admin identifies a compliance, conduct, or license violation

```
Admin                       API (Admin Module)              Database
  │                               │                              │
  │── PUT /api/admin/doctors/{id}/suspend
  │   { reason: "License expired" }│                             │
  │                               │── Validate: JWT Admin role  │
  │                               │── Load Doctor by id         │
  │                               │── Validate: current status = Approved
  │                               │── Set ApprovalStatus = Suspended
  │                               │── Set IsPubliclyVisible = false ─►│
  │                               │── Create AdminAuditLog ──────────►│
  │                               │   ActionType = DoctorSuspended    │
  │◄── 200 { message } ───────────│                              │
```

**Post-suspension state:**
- Doctor removed from public search immediately
- New bookings blocked (patient search returns no suspended doctors)
- **Existing scheduled consultations remain untouched** — sessions already booked are not cancelled by suspension; they continue as normal
- Doctor can be reactivated via `PUT /api/admin/doctors/{id}/reactivate`

---

## 6. Doctor Reactivation Flow

**Trigger:** Admin resolves the suspension reason (e.g., license renewed)

```
Admin── PUT /api/admin/doctors/{id}/reactivate
        { reason: "License renewed and verified" }
        │
        ├── Set ApprovalStatus = Approved
        ├── Set IsPubliclyVisible = true (if IsProfileCompleted = true)
        └── Create AdminAuditLog (ActionType = DoctorReactivated)
```

---

## 7. Patient Moderation Flow

**Trigger:** Admin receives report of abusive, fraudulent, or policy-violating patient behaviour

```
Admin                       API (Admin Module)              Database
  │                               │                              │
  │── PUT /api/admin/patients/{id}/block
  │   { reason: "Fraudulent payment" }                          │
  │                               │── Validate: JWT Admin role  │
  │                               │── Load Patient (via Users)  │
  │                               │── Validate: Role = Patient  │
  │                               │── Set Users.IsActive = false ─►│
  │                               │── Create AdminAuditLog ──────►│
  │                               │   ActionType = PatientBlocked │
  │◄── 200 { message } ───────────│                              │
  │                               │                              │
  │   [Patient attempts login]    │                              │
  │── POST /api/auth/login ───────►│── Check IsActive = false    │
  │◄── 403 Account disabled ──────│                              │
```

**Unblock path:**
```
Admin── PUT /api/admin/patients/{id}/unblock
        │
        ├── Set Users.IsActive = true
        └── Create AdminAuditLog (ActionType = PatientUnblocked)
```

**Business rules:**
- Blocked patient cannot login — `IsActive = false` is checked at the Auth layer on every login attempt
- Block/unblock is applied at `Users` level — affects all platform access for that account
- Reason field is mandatory for block actions; optional for unblock

---

## 8. Consultation Monitoring Flow

**Trigger:** Admin opens Consultation Management view

```
Admin                       API (Admin Module)
  │                               │
  │── GET /api/admin/consultations │
  │   ?status=Completed           │── Validate: JWT Admin role
  │   &doctorId=uuid              │── Apply filters (status, doctorId,
  │   &patientId=uuid             │   patientId, dateFrom, dateTo)
  │   &dateFrom=2026-05-01        │── Paginate results
  │   &page=1&pageSize=20         │── Return sanitized consultation list
  │◄── 200 { consultations[], meta }
  │                               │
  │── GET /api/admin/consultations/{id}
  │◄── 200 { consultationDetail }─│── Return full consultation detail
```

**Business rules:**
- Admin has **read-only access** to consultation data
- Admin **cannot alter, delete, or overwrite** any consultation record or medical notes
- Medical history is owned by the Consultation Module — immutable from Admin perspective
- Used for: dispute resolution review, platform analytics, compliance audits

---

## 9. Dashboard Analytics Flow

**Trigger:** Admin accesses the operational dashboard

```
Admin── GET /api/admin/dashboard
        │
        └── Aggregate in a single query:
              - Total registered doctors
              - Doctors pending approval
              - Doctors suspended
              - Total active patients
              - Total consultations (all time)
              - Completed consultations
              - Cancelled consultations
              - Today's consultations (CreatedAt::date = TODAY)
```

Response is a single aggregated payload — no N+1 queries. Implemented as a single SQL projection or compiled EF Core query.

---

## 10. Audit Log Flow

**Trigger:** Any admin state-changing action

```
Admin Action Completes Successfully
  │
  └── AdminAuditLogService.CreateAsync({
        AdminUserId:       <from JWT claim>,
        ActionType:        e.g. "DoctorApproved",
        TargetEntityType:  e.g. "Doctor",
        TargetEntityId:    <affected entity PK>,
        Reason:            <from request body, optional>,
        MetadataJson:      <snapshot of before/after state, optional>
      })
      │
      └── INSERT INTO AdminAuditLogs
```

**Rules:**
- Audit log write always happens **after** the primary state change succeeds
- If the audit log write fails, the primary operation is **not rolled back** — audit failure is logged to application telemetry but does not break the moderation action
- Audit logs are **append-only** — no UPDATE or DELETE operations on `AdminAuditLogs`

---

## 11. Business Rules Summary

| Rule | Detail |
|------|--------|
| Admin login | Email + password only; no OTP; no public registration |
| Admin seeding | UPSERT at startup — `ON CONFLICT DO NOTHING`; credentials from env vars |
| Pending doctors | Not publicly searchable; invisible to patients |
| Suspended doctors | Hidden from search; new bookings blocked; existing consultations unaffected |
| Blocked patients | `IsActive = false`; login rejected at Auth layer |
| Consultation data | Admin has read-only access; cannot modify medical records |
| Admin endpoints | All `/api/admin/*` routes require `Role = Admin` JWT claim |
| Audit trail | Every state-changing admin action creates an `AdminAuditLogs` row |
| Audit log retention | Append-only; no delete permitted |

