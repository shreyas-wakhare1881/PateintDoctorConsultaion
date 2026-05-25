# Admin Module — Database Schema Specification

> **Module:** Admin  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-25

---

## 1. Overview

The Admin Module introduces **no separate `Admins` table**. Admin identity is managed entirely through `Users.Role = 'Admin'`. The module introduces exactly one new table: `AdminAuditLogs`, which records every governance action performed by an admin operator.

**Design principles applied:**
- Admin is a role on `Users`, not a separate entity — avoids identity duplication
- All platform tables (`Users`, `Doctors`, `Patients`, `Consultations`) are read/written directly
- Audit trail is mandatory — every state-changing admin action produces an `AdminAuditLogs` row
- Admin is seeded at system startup via UPSERT — never registered through a public API

---

## 2. Tables Reused (No Schema Changes Required)

The Admin Module operates against the following tables owned by other modules. No new columns are added.

| Table | Owner Module | Admin Access Pattern |
|-------|--------------|----------------------|
| `Users` | Auth | Read user identity; toggle `IsActive` for patient blocking |
| `Doctors` | Doctor | Read profile; update `ApprovalStatus`, `IsPubliclyVisible` |
| `Patients` | Patient | Read profile; used for block/unblock resolution via `Users.IsActive` |
| `Consultations` | Consultation | Read-only monitoring; no direct mutation |
| `ConsultationStatusHistories` | Consultation | Read-only audit trail reference |

---

## 3. Table: `AdminAuditLogs`

### 3.1 Purpose

Every admin action that changes platform state **must produce an audit log entry**. This table provides a tamper-evident record for compliance, incident review, and operational governance — equivalent to an event log in production healthcare systems.

Tracked actions include:
- Doctor approval, rejection, suspension, reactivation
- Patient account block/unblock
- Any moderation override

### 3.2 Full Column Reference

| Column               | PostgreSQL Type              | Nullable | Default                   | Description |
|----------------------|------------------------------|----------|---------------------------|-------------|
| `Id`                 | `uuid`                       | NO       | `gen_random_uuid()`       | Primary key |
| `AdminUserId`        | `uuid`                       | NO       | —                         | FK → `Users.Id`; the admin who performed the action |
| `ActionType`         | `character varying(50)`      | NO       | —                         | Enum-style label: `DoctorApproved`, `DoctorRejected`, `DoctorSuspended`, `DoctorReactivated`, `PatientBlocked`, `PatientUnblocked` |
| `TargetEntityType`   | `character varying(50)`      | NO       | —                         | The entity class affected: `Doctor`, `Patient`, `Consultation` |
| `TargetEntityId`     | `uuid`                       | NO       | —                         | PK of the affected row in the target entity table |
| `Reason`             | `text`                       | YES      | `NULL`                    | Optional human-readable reason supplied by the admin at action time |
| `MetadataJson`       | `jsonb`                      | YES      | `NULL`                    | Arbitrary context snapshot — e.g., previous state, changed fields, reviewer notes |
| `CreatedAt`          | `timestamp with time zone`   | NO       | `CURRENT_TIMESTAMP`       | Immutable action timestamp |

### 3.3 Constraints

```sql
ALTER TABLE "AdminAuditLogs"
  ADD CONSTRAINT "FK_AdminAuditLogs_Users_AdminUserId"
  FOREIGN KEY ("AdminUserId") REFERENCES "Users" ("Id");
```

> `ON DELETE RESTRICT` — audit log rows must never be orphaned. Admin accounts cannot be deleted while audit records exist.

### 3.4 Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `PK_AdminAuditLogs` | `Id` | Primary key lookup |
| `IX_AdminAuditLogs_AdminUserId` | `AdminUserId` | Audit trail per admin operator |
| `IX_AdminAuditLogs_TargetEntityId` | `TargetEntityId` | Fetch all actions against a specific doctor/patient |
| `IX_AdminAuditLogs_CreatedAt` | `CreatedAt DESC` | Chronological audit feed, dashboard queries |

### 3.5 ActionType Reference Values

| Value | Trigger |
|-------|---------|
| `DoctorApproved` | Admin sets `ApprovalStatus = Approved` |
| `DoctorRejected` | Admin sets `ApprovalStatus = Rejected` |
| `DoctorSuspended` | Admin sets `ApprovalStatus = Suspended` |
| `DoctorReactivated` | Admin restores `ApprovalStatus = Approved` from `Suspended` |
| `PatientBlocked` | Admin sets `Users.IsActive = false` for a Patient |
| `PatientUnblocked` | Admin sets `Users.IsActive = true` for a blocked Patient |

---

## 4. Seeded Admin Record

Admin users are **not registered through any public API**. They are inserted at system startup via an UPSERT strategy — ensuring the default admin always exists without ever creating duplicate records.

### 4.1 UPSERT Strategy

```sql
INSERT INTO "Users" (
  "Id", "FullName", "Email", "PhoneNumber",
  "PasswordHash", "Role", "IsActive", "IsVerified",
  "CreatedAt", "UpdatedAt"
)
VALUES (
  gen_random_uuid(),
  'Platform Admin',
  'admin@pdc.com',                     -- from ADMIN_EMAIL env var
  '+910000000000',
  '<bcrypt-hash-of-Admin@123>',        -- from ADMIN_PASSWORD env var (hashed at startup)
  'Admin',
  true,
  true,
  NOW(), NOW()
)
ON CONFLICT ("Email") DO NOTHING;
```

**Behaviour:**
- If `admin@pdc.com` already exists → `DO NOTHING` — no duplicate created
- If admin row is missing → inserted on first startup
- Password is BCrypt-hashed at startup using value from environment variable

### 4.2 Environment Variables (Required)

| Variable | Description |
|----------|-------------|
| `ADMIN_EMAIL` | Default admin login email (e.g. `admin@pdc.com`) |
| `ADMIN_PASSWORD` | Default admin plain-text password — BCrypt-hashed at startup (e.g. `Admin@123`) |

> **Security:** The default seeded password (`Admin@123`) **must be changed immediately on first production deployment**. Store `ADMIN_PASSWORD` only in a secrets manager (Azure Key Vault, AWS Secrets Manager, or `.env` file not committed to source control).

---

## 5. Entity Relationship Summary

```
Users (Role=Admin)
  │
  └──► AdminAuditLogs.AdminUserId    [1 admin → many audit logs]

AdminAuditLogs.TargetEntityId  ──► Doctors.Id  (when TargetEntityType = 'Doctor')
                                └──► Users.Id   (when TargetEntityType = 'Patient')
```

> `TargetEntityId` is a non-enforced logical FK (polymorphic reference) — enforced at application layer, not database layer, to support multiple target entity types without junction tables.

