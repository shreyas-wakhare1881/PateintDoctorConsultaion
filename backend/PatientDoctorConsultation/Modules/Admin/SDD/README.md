# Admin Module — Specification Overview

> **Module:** Admin  
> **Bounded Context:** Platform Governance & Operational Control  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-25

---

## 1. Purpose

The Admin Module is the **governance and moderation layer** of the PatientDoctorConsultation platform. It provides operational control over healthcare providers, patient accounts, and platform-wide data visibility — without ever acting as a healthcare participant itself.

Admins do not book consultations, write prescriptions, or interact with patients medically. Their function is limited to: provider verification, account moderation, compliance monitoring, and operational analytics.

---

## 2. Architecture Role

| Layer | Admin's Position |
|-------|-----------------|
| Identity | Operates as `Role = Admin` on the shared `Users` table — no separate `Admins` entity |
| Authentication | Email + password login via shared `/api/auth/login` — no OTP, no registration API |
| Data Access | Cross-module read/write on `Doctors`, `Users` (Patients), `Consultations` |
| Audit Trail | Writes to `AdminAuditLogs` table on every state-changing action |
| No medical access | Cannot modify consultation medical history; read-only on `Consultations` |

---

## 3. Admin Governance Responsibilities

| Domain | Responsibility |
|--------|---------------|
| **Doctor Onboarding** | Review and approve/reject newly registered doctor profiles |
| **Doctor Moderation** | Suspend licensed doctors for compliance or conduct violations; reactivate after resolution |
| **Patient Moderation** | Block/unblock patient accounts for policy violations or fraud |
| **Consultation Oversight** | Read-only monitoring of consultation status, volume, and history |
| **Dashboard Analytics** | Aggregate operational metrics — pending approvals, daily volume, totals |
| **Audit Compliance** | Every action is logged — tamper-evident record of all governance decisions |

---

## 4. Seeded Admin Strategy

Admins are **never registered through a public API**. They are seeded at application startup using an **UPSERT strategy** that guarantees exactly one admin record without ever creating duplicates.

**Mechanism:**
```sql
INSERT INTO "Users" (...)
VALUES (...)
ON CONFLICT ("Email") DO NOTHING;
```

- Runs on every application startup — fully idempotent
- Credentials sourced from environment variables: `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Password is BCrypt-hashed at startup — never stored as plain text
- If the admin record already exists → startup continues without modification

**Default seeded credentials:**

| Field | Value |
|-------|-------|
| Email | Configured via `ADMIN_EMAIL` env var (e.g. `admin@pdc.com`) |
| Password | Configured via `ADMIN_PASSWORD` env var (e.g. `Admin@123`) |
| Role | `Admin` |

> **Security requirement:** The default password (`Admin@123`) **must be changed on first production deployment**. Store credentials in a secrets manager — never commit `.env` files containing admin credentials to source control.

---

## 5. Audit Logging

Every admin action that changes platform state produces an immutable `AdminAuditLogs` entry.

| Field | Purpose |
|-------|---------|
| `AdminUserId` | Identity of the acting admin |
| `ActionType` | Machine-readable action label (`DoctorApproved`, `PatientBlocked`, etc.) |
| `TargetEntityType` | Affected entity class (`Doctor`, `Patient`) |
| `TargetEntityId` | PK of the affected row |
| `Reason` | Human-readable moderation reason |
| `MetadataJson` | Optional before/after state snapshot for forensic review |
| `CreatedAt` | Immutable action timestamp |

Audit logs are **append-only**. No UPDATE or DELETE is permitted on this table.

---

## 6. Security Model

| Mechanism | Detail |
|-----------|--------|
| **Authentication** | JWT issued via `/api/auth/login` with `role = Admin` claim |
| **Route protection** | All `/api/admin/*` routes require `[Authorize(Roles = "Admin")]` |
| **No public registration** | Admin accounts cannot be created via any API endpoint |
| **Credential security** | Credentials stored in environment variables; BCrypt-hashed at rest |
| **No medical write access** | Consultation records are read-only from Admin perspective |
| **Account disable** | Admin can deactivate their own account only via DB/ops — no self-serve disable |

---

## 7. Doctor Approval State Machine

```
[Doctor Registers]
     │
     ▼
  Pending ──── Admin Approves ──► Approved ──── Admin Suspends ──► Suspended
     │                                │                                │
     └── Admin Rejects ──► Rejected   └──── IsPubliclyVisible=true     └── Admin Reactivates
                               │             (if ProfileCompleted)           │
                       (Doctor can update                               Approved again
                        and resubmit)
```

---

## 8. Module Dependencies

| Dependency | Direction | Purpose |
|------------|-----------|---------|
| **Auth Module** | Reads `Users` | Admin identity validation; patient IsActive toggle |
| **Doctor Module** | Reads + Writes `Doctors` | ApprovalStatus, IsPubliclyVisible management |
| **Patient Module** | Reads `Patients`, Writes `Users.IsActive` | Patient block/unblock |
| **Consultation Module** | Reads `Consultations`, `ConsultationStatusHistories` | Monitoring only — no write |

---

## 9. Core Features Summary

| Feature | Description |
|---------|-------------|
| **Seeded Admin** | Auto-seeded at startup via UPSERT; credentials from env vars |
| **Doctor Approval** | 4-state workflow: Pending → Approved / Rejected / Suspended |
| **Doctor Suspension** | Immediate visibility removal; existing consultations unaffected |
| **Patient Blocking** | `IsActive = false` at Auth layer; blocks all platform access |
| **Consultation Monitoring** | Read-only cross-module view; no medical data mutation |
| **Audit Logging** | Append-only `AdminAuditLogs` for every governance action |
| **Dashboard Analytics** | Single-query aggregated platform statistics |

---

## 10. SDD File Index

| File | Contents |
|------|---------|
| [Database.md](./Database.md) | `AdminAuditLogs` schema; seeding UPSERT logic; env var requirements |
| [Flow.md](./Flow.md) | Seeded startup, login, approval, suspension, patient moderation, audit flows |
| [APIs.md](./APIs.md) | All 14 admin endpoint contracts with request/response/validation |

