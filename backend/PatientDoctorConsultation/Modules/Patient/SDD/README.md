# Patient Module — Specification Overview

> **Module:** Patient  
> **Bounded Context:** Healthcare Consumer Management  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-24

---

## 1. Purpose

The Patient Module manages the complete healthcare profile lifecycle for patient users on the PatientDoctorConsultation platform. It handles profile creation, health data management, and provides patients with access to doctor discovery — all within a strictly private, authenticated context.

Unlike the Doctor Module, patients are **not subject to admin approval**. A successfully verified OTP is the only gate between a user account and an active patient profile.

---

## 2. Business Purpose

This module solves a core product challenge: **collecting sufficient healthcare context about the patient** so that doctors can deliver informed, relevant consultations.

A patient must:
1. Authenticate via OTP (handled by Auth Module)
2. Create a healthcare profile with relevant personal health data
3. Complete the mandatory profile fields to become **consultation-ready**
4. Discover appropriate doctors and initiate bookings

Until the mandatory profile fields are completed, the patient cannot book a consultation.

---

## 3. Core Features

| Feature | Description |
|---------|-------------|
| **OTP-based Onboarding** | Patient authentication is passwordless — OTP to registered email |
| **Healthcare Profile Creation** | One-time profile setup with health, location, and emergency data |
| **Profile Management** | Patient can update any profile field at any time |
| **Profile Completion Gate** | `IsProfileCompleted` flag gates consultation booking capability |
| **Soft Delete** | Patient profiles are deactivated, not hard-deleted — GDPR-friendly |
| **Doctor Discovery** | Authenticated patient-scoped view of the approved doctor directory |
| **Data Privacy** | All patient medical data is strictly private — no public exposure |

---

## 4. Database Tables

| Table | Purpose |
|-------|---------|
| `Patients` | Stores personal health profile, emergency contact, and location data |

> Full schema details: [Database.md](./Database.md)

---

## 5. Main Business Flows

| Flow | Summary |
|------|---------|
| **Onboarding** | Verify OTP → create patient profile → become consultation-ready |
| **Login** | OTP verify → JWT issued → load profile → check `IsProfileCompleted` |
| **Profile Completion** | Fill mandatory fields → `IsProfileCompleted = true` |
| **Consultation Readiness** | Browse doctors → select slot → book (requires completed profile) |
| **Data Privacy** | JWT binding ensures patients can only see their own data |
| **Soft Delete** | Patient requests removal → `DeletedAt` set → data retained for compliance |

> Full flow diagrams: [Flow.md](./Flow.md)

---

## 6. API Summary

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `POST` | `/api/patients/profile` | Patient JWT | Create healthcare profile |
| `GET` | `/api/patients/me` | Patient JWT | Get own profile |
| `PUT` | `/api/patients/me` | Patient JWT | Update profile (partial) |
| `DELETE` | `/api/patients/me` | Patient JWT | Soft delete profile |
| `GET` | `/api/patients/doctors` | Patient JWT | Browse approved doctors |

> Full API contracts: [APIs.md](./APIs.md)

---

## 7. Security Overview

| Concern | Implementation |
|---------|----------------|
| **Authentication** | JWT Bearer token — issued by Auth Module after OTP verification |
| **Authorization** | Role claim `Patient` enforced on all `/api/patients/*` routes |
| **Data isolation** | All queries are scoped to `UserId` extracted from JWT claim |
| **No self-elevation** | `UserId` and `Role` cannot be supplied in request body — JWT claims only |
| **Soft delete enforcement** | Global EF query filter (`DeletedAt == null`) on all queries |
| **No cross-patient access** | No endpoint accepts a patient ID as a URL or body parameter |

---

## 8. Privacy Overview

| Concern | Rule |
|---------|------|
| **Medical data is private** | `Allergies`, `ChronicDiseases`, `BloodGroup` are never included in any public-facing response |
| **No patient listing** | There is no endpoint that returns a list of patients — not even for Admins at this module level |
| **Auth fields excluded** | `Email`, `PasswordHash`, `Role`, and `RefreshTokens` are in `Users` only — never in `Patients` |
| **Age not persisted** | Only `DateOfBirth` is stored; age is derived at application layer |
| **GDPR-aligned soft delete** | Data is retained for compliance; visible only to data retention jobs |
| **HIPAA-aligned design** | No patient medical data is logged, cached in public layers, or included in error messages |

---

## 9. Future Enhancements

| Enhancement | Notes |
|-------------|-------|
| **Medical Records** | Upload and manage lab reports, prescriptions, and discharge summaries |
| **Prescription History** | View prescriptions issued during past consultations |
| **Lab Report Integration** | Connect with diagnostic lab APIs for automatic report delivery |
| **Insurance Management** | Store and verify insurance provider and policy details |
| **Health Analytics Dashboard** | BMI trends, consultation frequency, chronic condition tracking |
| **AI Symptom Checker** | Pre-consultation AI assistant to recommend relevant specialties |
| **Vaccination Records** | Track immunization history |
| **Structured Allergy/Disease Data** | Replace free-text fields with multi-select validated datasets |
| **Family Profile Management** | Allow one patient account to manage profiles for family members |

---

## 10. Dependencies

| Module / System | Dependency Type |
|-----------------|-----------------|
| **Auth Module** | Upstream — provides `UserId`, JWT, and `Role = Patient` via OTP authentication |
| **Doctor Module** | Consumer — Patient module reads Doctor Module's public listing for doctor discovery |
| **Consultation Module** | Consumer — reads `IsProfileCompleted` before allowing booking; writes consultation history |
| **Storage Service** | External — handles `ProfileImageUrl` upload and CDN delivery |
| **Notification Service** | External — delivers OTP emails; future: appointment reminders and health alerts |

---

## 11. Comparison: Patient vs Doctor Module

| Aspect | Patient Module | Doctor Module |
|--------|---------------|---------------|
| Auth method | OTP (passwordless) | Email + Password |
| Admin approval | Not required | Required (4-state workflow) |
| Tables | 1 (`Patients`) | 2 (`Doctors`, `DoctorAvailabilities`) |
| Public exposure | None | Approved + complete doctors are publicly discoverable |
| Profile complexity | Personal health data | Professional credentials + availability schedule |
| Booking gate | `IsProfileCompleted = true` | `ApprovalStatus = Approved` |

