# Auth Module — Database Schema Specification

> **Module:** Auth  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-24

---

## 1. Overview

The `Users` table is the **single source of truth** for identity and authentication across the PatientDoctorConsultation platform. It consolidates user identity, credential storage, OTP state, JWT refresh token state, and auditing into one entity, aligned with the platform's single-table identity model.

**Design principles applied:**
- Single table per identity (no separate auth/profile split at this stage)
- Nullable fields for optional/lifecycle-bound data (OTP, refresh token)
- PostgreSQL-native types for performance and correctness
- Audit trail embedded at entity level

---

## 2. Table: `Users`

### 2.1 Full Column Reference

| Column                  | PostgreSQL Type       | Nullable | Default          | Description |
|-------------------------|-----------------------|----------|------------------|-------------|
| `Id`                    | `uuid`                | NO       | `gen_random_uuid()` | Primary key — globally unique user identity |
| `FullName`              | `character varying(256)` | NO    | —                | User's full display name |
| `Email`                 | `character varying(256)` | YES      | `NULL`           | Login identifier for Doctor/Admin; `NULL` for phone-only Patient accounts; partial unique index (non-null only) |
| `PhoneNumber`           | `text`               | NO       | —                | Required for all users; primary identifier for Patient OTP login; E.164 format |
| `PasswordHash`          | `text`                | YES      | `NULL`           | BCrypt hash; NULL for OTP-only users (patients) |
| `Role`                  | `character varying(50)`  | NO    | —                | Enum: `Patient`, `Doctor`, `Admin` |
| `IsActive`              | `boolean`             | NO       | `true`           | Soft-disable flag; inactive users cannot authenticate |
| `IsVerified`            | `boolean`             | NO       | `false`          | Set to `true` after first successful OTP verification |
| `OtpCode`               | `character varying(10)`  | YES   | `NULL`           | Current pending OTP; cleared after use |
| `OtpExpiresAt`          | `timestamp with time zone` | YES | `NULL`          | OTP validity window expiry timestamp |
| `RefreshToken`          | `text`                | YES      | `NULL`           | Hashed refresh token; NULL when logged out |
| `RefreshTokenExpiresAt` | `timestamp with time zone` | YES | `NULL`          | Sliding window expiry for refresh token |
| `CreatedAt`             | `timestamp with time zone` | NO  | `CURRENT_TIMESTAMP` | Record creation timestamp |
| `UpdatedAt`             | `timestamp with time zone` | NO  | `CURRENT_TIMESTAMP` | Last modification timestamp |
| `CreatedBy`             | `uuid`                | YES      | `NULL`           | User Id of creator (admin-seeded rows use system UUID) |
| `UpdatedBy`             | `uuid`                | YES      | `NULL`           | User Id of last modifier |

---

### 2.2 Field Group Breakdown

#### Identity Fields

| Field        | Purpose |
|--------------|---------|
| `Id`         | UUID v4 — avoids sequential enumeration attacks; portable across distributed systems |
| `FullName`   | Display identity — used in consultation headers, prescriptions, notifications |
| `Email`      | Login credential for Doctor/Admin; `NULL` for phone-only Patient accounts; partial unique index enforces uniqueness only for non-null values |
| `PhoneNumber`| **Required** for all users; primary Patient OTP identifier (E.164 format, e.g. `+919876543210`); checked for uniqueness at service layer |

#### Credential Fields

| Field          | Purpose |
|----------------|---------|
| `PasswordHash` | BCrypt hash (cost factor 12); stored for Doctor & Admin credential login; intentionally `NULL` for Patient role — patients authenticate via OTP only |
| `Role`         | Single-role per user; drives authorization at API layer via JWT claims |

#### Account Status Fields

| Field        | Purpose |
|--------------|---------|
| `IsActive`   | Admin-controlled soft-disable; takes precedence over all auth flows — inactive users are rejected regardless of valid credentials |
| `IsVerified` | Set after first OTP confirmation; unverified accounts cannot access protected routes |

#### OTP Fields

| Field          | Purpose |
|----------------|---------|
| `OtpCode`      | Plain 6-digit OTP stored directly on the user row (single active OTP model); overwritten on each new OTP request |
| `OtpExpiresAt` | UTC timestamp; OTP is invalid if `CURRENT_TIMESTAMP > OtpExpiresAt`; set to `+5 minutes` from generation time |

> **Why on-row OTP vs separate table?**  
> A single active OTP per user is sufficient for this platform. A separate `OtpCodes` table is only justified when multi-device concurrent OTP issuance is required. Future migration path exists if needed.

#### JWT & Refresh Token Fields

| Field                   | Purpose |
|-------------------------|---------|
| `RefreshToken`          | SHA-256 hashed value of the issued refresh token; never stored as plain text |
| `RefreshTokenExpiresAt` | Absolute expiry; sliding window policy is enforced at service layer, not DB layer |

> **Invalidation model:** On logout, both `RefreshToken` and `RefreshTokenExpiresAt` are set to `NULL`. On new login, previous refresh token is overwritten — single-session model per user by design.

#### Audit Fields

| Field       | Purpose |
|-------------|---------|
| `CreatedAt` | Immutable after INSERT; used for registration analytics and compliance |
| `UpdatedAt` | Updated on every profile or auth state change via EF Core interceptor |
| `CreatedBy` | UUID of creating actor; system UUID (`00000000-...`) for seeded/admin-created accounts |
| `UpdatedBy` | UUID of last modifying actor; nullable to support system-initiated updates |

---

## 3. Constraints

| Constraint Type | Column(s)       | Rule |
|-----------------|-----------------|------|
| Primary Key     | `Id`            | Unique, non-null UUID |
| Unique          | `Email`         | One account per email address globally |
| Not Null        | `FullName`, `Email`, `Role`, `IsActive`, `IsVerified`, `CreatedAt`, `UpdatedAt` | Core identity fields must always be present |
| Check (app-layer) | `Role`        | Must be one of: `Patient`, `Doctor`, `Admin` |
| Check (app-layer) | `OtpExpiresAt` | Must be in the future at time of OTP issuance |

---

## 4. Indexes

| Index Name                      | Column(s)       | Type    | Purpose |
|---------------------------------|-----------------|---------|---------|
| `PK_Users`                      | `Id`            | B-Tree  | Primary key lookup |
| `IX_Users_Email`                | `Email`         | B-Tree  | Login query — most frequent auth lookup |
| `IX_Users_Role`                 | `Role`          | B-Tree  | Role-based filtering for admin dashboards |
| `IX_Users_IsActive_IsVerified`  | `IsActive`, `IsVerified` | Composite B-Tree | Auth pipeline pre-check — reject inactive/unverified in single index scan |

> **Future index:** `IX_Users_RefreshToken` (partial, WHERE `RefreshToken IS NOT NULL`) — justified only if refresh token rotation volume exceeds ~10K concurrent sessions.

---

## 5. Nullable Field Rationale

| Nullable Field          | Why Nullable |
|-------------------------|--------------|
| `PhoneNumber`           | Doctors and Admins do not require phone number for login; optional at registration |
| `PasswordHash`          | Patients use OTP-only authentication; no password is set or required |
| `OtpCode`               | Only populated during active OTP session; `NULL` between sessions |
| `OtpExpiresAt`          | Lifecycle-bound to OTP; `NULL` when no pending OTP exists |
| `RefreshToken`          | `NULL` when user is logged out or token has never been issued |
| `RefreshTokenExpiresAt` | Mirrors `RefreshToken` nullability |
| `CreatedBy`             | System-seeded records have no human creator |
| `UpdatedBy`             | System-automated updates (e.g., scheduled OTP cleanup) have no human actor |

---

## 6. PostgreSQL Type Selection Rationale

| Type                       | Used For         | Why |
|----------------------------|------------------|-----|
| `uuid`                     | `Id`, `CreatedBy`, `UpdatedBy` | Native 128-bit UUID; efficient indexing; no sequential guess attacks |
| `character varying(n)`     | `Email`, `FullName`, `Role`, `PhoneNumber`, `OtpCode` | Bounded strings — prevent unbounded data insertion |
| `text`                     | `PasswordHash`, `RefreshToken` | Variable-length cryptographic strings; BCrypt output is always 60 chars but `text` allows algorithm upgrades without schema change |
| `boolean`                  | `IsActive`, `IsVerified` | Native PostgreSQL bool; no integer-flag anti-pattern |
| `timestamp with time zone` | All timestamp fields | Timezone-aware; critical for OTP expiry correctness across distributed deployments |

---

## 7. Security Considerations

- **PasswordHash** — BCrypt with cost factor ≥ 12; never log, never return in API responses
- **OtpCode** — Stored as plain text (6-digit numeric); acceptable given 5-minute TTL + per-attempt invalidation; upgrade path to HMAC-based OTP exists
- **RefreshToken** — Stored as SHA-256 hash; raw token only ever transmitted to client over HTTPS
- **Email** — Treated as PII; excluded from all log outputs; encrypted at rest when cloud KMS is enabled
- **IsActive gate** — Authentication pipeline checks `IsActive` before any credential validation to prevent timing-based enumeration

---

## 8. Relationships & Future Scope

### Current State
The `Users` table has no foreign key relationships within the Auth module. It is referenced by other modules (Doctor, Patient, Consultation) via `UserId` on their respective tables.

### Planned Relationships (Future Modules)

| Module       | Relationship | Description |
|--------------|--------------|-------------|
| `Doctors`    | `Users.Id` → `Doctors.UserId` (1:1) | Doctor profile extends User identity |
| `Patients`   | `Users.Id` → `Patients.UserId` (1:1) | Patient profile extends User identity |
| `AuditLogs`  | `Users.Id` → `AuditLogs.ActorId` (1:N) | Compliance log of auth events |
| `Sessions`   | `Users.Id` → `Sessions.UserId` (1:N) | Multi-device session management (future) |

---

## 9. Future Scalability Notes

- **Multi-device sessions:** Replace single `RefreshToken` column with a separate `UserSessions` table (1:N) to support concurrent logins across devices
- **MFA support:** Add `MfaEnabled (boolean)`, `MfaSecret (text)` columns — no schema breaking change required
- **OAuth integration:** Add `OAuthProvider (varchar)`, `OAuthProviderId (varchar)` columns for Google/Microsoft SSO
- **OTP via SMS:** `PhoneNumber` is already captured; OTP delivery channel switch requires only service-layer change
- **Soft delete:** Add `DeletedAt (timestamptz)` and `DeletedBy (uuid)` columns to enable GDPR-compliant account erasure workflows
- **Row-level security:** PostgreSQL RLS policies can be applied on `Role` column for database-level multitenancy in future SaaS expansion
