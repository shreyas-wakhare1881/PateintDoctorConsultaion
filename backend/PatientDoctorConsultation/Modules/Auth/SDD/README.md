# Auth Module — Specification Overview

> **Module:** Auth  
> **Bounded Context:** Identity & Access Management  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-24

---

## 1. Purpose

The Auth Module is the **security gateway** of the PatientDoctorConsultation platform. It is responsible for:

- **Identity verification** — confirming who the user is
- **Authorization** — determining what the user can access
- **Session management** — issuing, rotating, and revoking tokens
- **Role enforcement** — binding identity to access scope

All other modules depend on Auth Module for identity claims. No module performs its own authentication.

---

## 2. Supported Authentication Methods

| Method | Actors | Mechanism |
|--------|--------|-----------|
| **OTP Login** | Patient | 6-digit numeric OTP via **phone number** (SMS); no password, no email required |
| **Credential Login** | Doctor, Admin | Email + BCrypt-hashed password |
| **Token Refresh** | All roles | Single-use refresh token rotation |
| **MFA (Planned)** | Doctor, Admin | TOTP via Authenticator app |
| **OAuth (Planned)** | All roles | Google / Microsoft SSO |

---

## 3. JWT Architecture

```
Header.Payload.Signature
   |        |         |
 HS256    Claims    HMAC-SHA256(secret)

Claims included:
  sub   → User UUID
  email → User email (Doctor/Admin) or phone number (Patient)
  role  → Patient | Doctor | Admin
  jti   → Unique token ID (for future revocation)
  iat   → Issued at (UTC)
  exp   → Expires at (iat + 60 minutes)
```

**Token pair model:**

| Token         | TTL        | Transport | Storage (Client) |
|---------------|------------|-----------|------------------|
| Access Token  | 15 minutes | Authorization header | Memory / Secure cookie |
| Refresh Token | 7 days     | Request body / Secure cookie | HttpOnly cookie / Secure storage |

**Security properties:**
- Access token is **stateless** — no DB lookup required for validation
- Refresh token is **stateful** — validated against hashed DB record
- Token rotation on every refresh (single-use refresh tokens)
- Logout invalidates refresh token immediately; access token expires naturally

---

## 4. OTP Architecture

```
Generation      →  Storage         →  Delivery       →  Validation
  |                  |                  |                  |
6-digit random    On Users row       Email / SMS        Match + Expiry
numeric code      OtpCode field      via Notification   check (5 min TTL)
                  OtpExpiresAt       Service
```

**OTP properties:**
- **Length:** 6 digits (numeric)
- **TTL:** 5 minutes from generation
- **Single active OTP:** New request overwrites previous
- **Post-use:** Cleared from DB after successful verification
- **No rate limiting (v1):** Planned in v1.1 — max 3 requests per 15 minutes

---

## 5. Role System

```
Role        Access Scope
─────────   ──────────────────────────────────────────
Patient     /api/patient/** · /api/consultation/** (own records)
Doctor      /api/doctor/** · /api/consultation/** (assigned patients)
Admin       /api/admin/** · All user management routes
```

**Role rules:**
- A user has exactly **one role** — no multi-role support in v1
- Role is embedded in JWT claims — no DB lookup per request
- Role assignment is immutable after registration (Admin can change via admin API — planned)
- Admin accounts are **seeded only** — no self-registration pathway

---

## 6. Security Architecture

```
Request Pipeline
      │
      ▼
[HTTPS/TLS]          → All traffic encrypted in transit
      │
      ▼
[Rate Limiting]      → Planned: 429 responses for brute-force protection
      │
      ▼
[JWT Middleware]     → Signature + expiry validation
      │
      ▼
[Role Guard]         → Claims-based authorization
      │
      ▼
[IsActive Check]     → Soft-disable enforcement
      │
      ▼
[Handler]
```

**Security decisions:**
- Passwords hashed with **BCrypt (cost 12)** — resistant to GPU brute-force
- Refresh tokens stored as **SHA-256 hashes** — raw token never persisted
- OTP fields cleared immediately after use — no replay window
- `IsActive` flag checked at auth layer — instant account suspension without token revocation latency
- All auth errors return **generic messages** — no email enumeration leakage in production

---

## 7. Module Structure

```
Modules/Auth/
├── SDD/                        ← Specification documents (this folder)
│   ├── README.md               ← This file — module overview
│   ├── Database.md             ← DB schema specification
│   ├── Flow.md                 ← Authentication flow diagrams
│   └── APIs.md                 ← API contract specification
│
├── Commands/                   ← CQRS write operations
│   ├── SendOtp/
│   ├── VerifyOtp/
│   ├── Register/
│   ├── Login/
│   ├── RefreshToken/
│   └── Logout/
│
├── Queries/                    ← CQRS read operations
│   └── GetCurrentUser/
│
├── Contracts/                  ← Request/Response DTOs
│   ├── Requests/
│   └── Responses/
│
└── Events/                     ← Domain events (future)
    ├── UserRegistered/
    └── UserLoggedIn/
```

---

## 8. Authentication Lifecycle Summary

```
[Registration]
  New user submits credentials
  → Account created (IsVerified: false, IsActive: false for Doctor)
  → Admin approves Doctor → IsActive: true

[First Login / OTP Verification]
  User authenticates successfully
  → IsVerified set to true
  → JWT access token + refresh token issued

[Active Session]
  Client uses access token (15 min)
  → On expiry: POST /auth/refresh with refresh token
  → New token pair issued, old refresh token rotated

[Logout]
  Client calls POST /auth/logout
  → Refresh token revoked in DB
  → Access token expires naturally (max 15 min residual)

[Account Deactivation]
  Admin sets IsActive = false
  → Existing access tokens expire within 15 min
  → Refresh token rejected immediately on next rotation attempt
```

---

## 9. Inter-Module Dependencies

| Dependency | Direction | Purpose |
|------------|-----------|---------|
| `Infrastructure.Identity.Jwt` | Auth → Infra | JWT signing and validation |
| `Infrastructure.Identity.OTP` | Auth → Infra | OTP generation and storage |
| `Infrastructure.Notifications` | Auth → Infra | OTP delivery (email/SMS) |
| `Shared.Security` | Auth → Shared | BCrypt helpers, token utilities |
| `Doctor Module` | Doctor → Auth | Doctor registration triggers auth user creation |
| `Patient Module` | Patient → Auth | Patient OTP verification creates auth identity |

---

## 10. Future Scalability Plans

### v1.1 — Near Term
- OTP rate limiting (max 3 requests / 15 min per email)
- Failed OTP attempt tracking + lockout after 3 attempts
- JWT `jti` blacklist via Redis for immediate access token revocation
- Audit log for login events (`UserLoggedIn` domain event)

### v2.0 — Medium Term
- **MFA support** — TOTP via Google Authenticator (RFC 6238)
- **Multi-device sessions** — `UserSessions` table replacing single refresh token column
- **OAuth 2.0** — Google and Microsoft SSO integration
- **Refresh token families** — detect token reuse attacks

### v3.0 — Long Term
- **WebAuthn / Passkeys** — passwordless biometric authentication
- **Federated identity** — SAML 2.0 for hospital system integration
- **Row-level security** — PostgreSQL RLS for multitenancy
- **Zero-trust model** — per-request authorization with short-lived tokens

---

## 11. SDD Document Index

| Document | Content | Audience |
|----------|---------|----------|
| [Database.md](./Database.md) | Users table schema, columns, indexes, constraints, security | Backend, DBA, DevOps |
| [Flow.md](./Flow.md) | All auth flows with ASCII diagrams and state transitions | Backend, Frontend, QA |
| [APIs.md](./APIs.md) | Full API contracts, request/response, status codes, validation | Frontend, Backend, QA |
| [README.md](./README.md) | Module overview, architecture, lifecycle, future plans | All teams |
