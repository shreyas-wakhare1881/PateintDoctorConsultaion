# Doctor Module — Specification Overview

> **Module:** Doctor  
> **Bounded Context:** Healthcare Provider Management  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-24

---

## 1. Purpose

The Doctor Module manages the complete lifecycle of healthcare providers on the PatientDoctorConsultation platform. It handles professional onboarding, admin-controlled approval, availability scheduling, and public discoverability for patients.

All other modules that interact with doctors (Consultation, Admin, Patient) depend on this module's approval and profile state.

---

## 2. Business Purpose

This module solves a core product challenge: **verifying and publishing trusted healthcare providers** to patients.

A doctor must:
1. Register and complete a professional profile
2. Be reviewed and approved by an Admin
3. Configure their availability schedule
4. Become publicly discoverable to patients

Until all four steps are done, no patient can book a consultation with the doctor.

---

## 3. Core Features

| Feature | Description |
|---------|-------------|
| **Doctor Registration** | Self-service registration with email + password (Auth Module) |
| **Profile Onboarding** | Multi-field professional profile creation |
| **Admin Approval Workflow** | 4-state approval gate: Pending → Approved / Rejected / Suspended |
| **Availability Management** | Weekly recurring consultation slot configuration |
| **Public Discoverability** | Filterable doctor listing for patients; no auth required |
| **Soft Delete** | Doctor accounts are deactivated, not hard-deleted |
| **Engagement Metrics** | Rating, review count, and consultation count maintained by Consultation Module |

---

## 4. Database Tables

| Table | Purpose |
|-------|---------|
| `Doctors` | Stores professional profile, approval state, and engagement metrics |
| `DoctorAvailabilities` | Stores recurring weekly consultation slot schedule |

> Full schema details: [Database.md](./Database.md)

---

## 5. Main Business Flows

| Flow | Summary |
|------|---------|
| **Onboarding** | Register → create profile → await admin approval |
| **Login** | Email + password → JWT issued → dashboard state determined by approval status |
| **Profile Completion** | Fill mandatory fields → `IsProfileCompleted = true` |
| **Admin Approval** | Admin reviews pending profiles → Approve / Reject / Suspend |
| **Availability Setup** | Approved doctor adds weekly recurring consultation slots |
| **Patient Discovery** | Patients search doctors by city, specialization, language, fee |

> Full flow diagrams: [Flow.md](./Flow.md)

---

## 6. API Summary

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/doctors/profile` | Create doctor profile (Doctor) |
| `GET`  | `/api/doctors/me` | Fetch own profile (Doctor) |
| `PUT`  | `/api/doctors/me` | Update own profile (Doctor) |
| `POST` | `/api/doctors/availability` | Add availability slot (Doctor) |
| `GET`  | `/api/doctors/availability` | Get own availability (Doctor) |
| `PUT`  | `/api/doctors/availability/{id}` | Update availability slot (Doctor) |
| `DELETE` | `/api/doctors/availability/{id}` | Delete availability slot (Doctor) |
| `GET`  | `/api/doctors` | Public doctor listing (None) |
| `GET`  | `/api/doctors/{doctorId}` | Public doctor details (None) |

> Full API contracts: [APIs.md](./APIs.md)

---

## 7. Security Overview

| Concern | Implementation |
|---------|----------------|
| **Authentication** | JWT Bearer token — issued by Auth Module |
| **Authorization** | Role claim `Doctor` enforced on all `/api/doctors/me` and availability routes |
| **Approval gate** | Availability write operations blocked unless `ApprovalStatus = Approved` |
| **Data isolation** | Doctors can only read/update their own profile and slots |
| **Public exposure** | Private fields (LicenseNumber, UserId, audit fields) never returned in public endpoints |
| **Soft delete** | Deleted doctors are filtered via global EF query filter — never exposed via any endpoint |

---

## 8. Approval Workflow

```
┌──────────────┐
│  Registered  │
│  (Auth only) │
└──────┬───────┘
       │  Creates profile
       ▼
┌──────────────┐
│   Pending    │◄────── Doctor re-submits after rejection
└──────┬───────┘
       │
   Admin Review
       │
  ┌────┴────┐
  │         │
  ▼         ▼
Approved  Rejected
  │
  │  Admin can suspend
  ▼
Suspended
```

| Status | Publicly Visible | Can Set Availability | Can Consult |
|--------|-----------------|----------------------|-------------|
| Pending | No | No | No |
| Approved | Yes (if profile complete) | Yes | Yes |
| Rejected | No | No | No |
| Suspended | No | No | No |

---

## 9. Dependencies

| Module / System | Dependency Type |
|-----------------|-----------------|
| **Auth Module** | Upstream — provides `UserId`, JWT, and `Role = Doctor` |
| **Admin Module** | Consumer — reads `Doctors` table to manage approval workflow |
| **Consultation Module** | Consumer — reads `DoctorAvailabilities` for booking; updates `Rating`, `TotalReviews`, `TotalConsultations` |
| **Storage Service** | External — handles `ProfileImageUrl` upload and CDN delivery |
| **Notification Service** | External — sends approval / rejection notifications to doctor email |

---

## 10. Future Enhancements

| Enhancement | Notes |
|-------------|-------|
| **Document Upload** | Allow doctors to upload license and degree PDFs for Admin verification |
| **Multi-location Support** | Doctor can register multiple clinic addresses |
| **Calendar-based Availability** | Override recurring slots with date-specific exceptions |
| **Re-submission Workflow** | Auto-notify Admin when a Rejected doctor updates and resubmits profile |
| **Video Profile** | Short intro video upload for doctor discovery page |
| **MFA for Doctors** | TOTP-based two-factor authentication (Auth Module concern) |

