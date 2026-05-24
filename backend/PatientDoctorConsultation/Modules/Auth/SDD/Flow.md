# Auth Module — Authentication Flow Specification

> **Module:** Auth  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-24

---

## 1. Actor & Role Matrix

| Actor   | Login Method       | Password Required | OTP Required | Route Access |
|---------|--------------------|-------------------|--------------|--------------|
| Patient | OTP (Phone Number only)  | NO                | YES          | Patient routes |
| Doctor  | Email + Password   | YES               | NO           | Doctor routes  |
| Admin   | Email + Password   | YES               | NO           | Admin routes   |

---

## 2. Patient OTP Login Flow

**Trigger:** Patient opens app → enters mobile number → clicks "Get OTP"

```
Patient                     API                         Database
  |                           |                              |
  |-- POST /auth/send-otp --->|                              |
  |   { phoneNumber }         |-- Lookup user by phone ----->|
  |                           |-- If not found: auto-create  |
  |                           |   Patient user (no email)  ->|
  |                           |-- Check Role = Patient       |
  |                           |-- Check IsActive = true      |
  |                           |-- Generate 6-digit OTP       |
  |                           |-- Save OTP + Expiry -------->|
  |                           |-- (Send SMS via future Svc)  |
  |<-- 200 { message } -------|                              |
  |                           |                              |
  |-- POST /auth/verify-otp ->|                              |
  |   { phoneNumber, otp }    |-- Fetch user by phone ------>|
  |                           |<-- OtpCode + OtpExpiresAt ---|
  |                           |-- Validate: not expired      |
  |                           |-- Validate: code matches     |
  |                           |-- Set IsVerified = true      |
  |                           |-- Clear OtpCode, OtpExpiresAt|
  |                           |-- Generate JWT + RefreshToken|
  |                           |-- Save hashed RefreshToken ->|
  |<-- 200 { jwt, refresh } --|                              |
```

**Step-by-step:**
1. Patient submits phone number in E.164 format (e.g. `+919876543210`)
2. System looks up User by `PhoneNumber`
3. If no user found: auto-creates a lightweight Patient account (`Email = null`, `FullName = ""`, `Role = Patient`)
4. If phone belongs to a Doctor/Admin: reject with `DomainValidationException`
5. System generates cryptographically random 6-digit OTP
6. OTP stored on `Users.OtpCode`, expiry set to `NOW() + 5 minutes`
7. OTP dispatched via SMS (current: returned in dev config `Otp:DevFixedCode`; future: SMS gateway)
8. Patient submits phone number + OTP code
9. System fetches user by PhoneNumber, checks `OtpExpiresAt > NOW()`
10. System compares submitted OTP against stored `OtpCode`
11. On match: `IsVerified = true`, OTP fields cleared, JWT pair issued
12. On failure: 401 returned, OTP fields remain (until expiry)

---

## 3. Doctor Login Flow

**Trigger:** Doctor opens app → enters email + password

```
Doctor                      API                         Database
  |                           |                              |
  |-- POST /auth/login ------>|                              |
  |   { email, password,      |-- Lookup user by email ----->|
  |     role: "Doctor" }      |<-- User row returned --------|
  |                           |-- Check IsActive = true      |
  |                           |-- Check Role = "Doctor"      |
  |                           |-- BCrypt.Verify(password,    |
  |                           |     PasswordHash)            |
  |                           |-- Generate JWT + RefreshToken|
  |                           |-- Save hashed RefreshToken -->|
  |<-- 200 { jwt, refresh } --|                              |
```

**Step-by-step:**
1. Doctor submits `{ email, password, role: "Doctor" }`
2. System queries user by email
3. Check: `IsActive = true` → reject if false
4. Check: `Role == "Doctor"` → reject role mismatch
5. BCrypt hash comparison against `PasswordHash`
6. On success: JWT access token + refresh token issued
7. Refresh token SHA-256 hashed and persisted to DB

---

## 4. Admin Login Flow

Identical to Doctor login flow with `role: "Admin"` validation.

**Additional constraint:** Admin accounts are seeded only — no self-registration endpoint exists for Admin role.

---

## 5. JWT Generation Flow

```
[Service Layer]
  |
  |-- Collect claims:
  |     sub: Users.Id (UUID)
  |     email: Users.Email
  |     role: Users.Role
  |     jti: new UUID (token ID for revocation)
  |     iat: current UTC timestamp
  |     exp: NOW() + 15 minutes
  |
  |-- Sign with HS256 using JwtSecretKey (from config)
  |
  |-- Return: { accessToken (JWT), refreshToken (raw UUID) }
  |
  |-- Hash refreshToken (SHA-256) → store in DB
```

**Token TTLs:**

| Token         | Lifetime    | Stored In       |
|---------------|-------------|-----------------|
| Access Token  | 15 minutes  | Client memory / cookie |
| Refresh Token | 7 days      | DB (hashed) + Client (raw) |

---

## 6. Refresh Token Flow

**Trigger:** Client receives 401 → attempts token refresh

```
Client                      API                         Database
  |                           |                              |
  |-- POST /auth/refresh ----->|                              |
  |   { refreshToken }        |-- Hash submitted token       |
  |                           |-- Lookup by hash ----------->|
  |                           |<-- User row + expiry --------|
  |                           |-- Check: expiry > NOW()      |
  |                           |-- Check: IsActive = true     |
  |                           |-- Issue new JWT              |
  |                           |-- Rotate refresh token       |
  |                           |-- Save new hashed refresh -->|
  |<-- 200 { jwt, refresh } --|                              |
```

**Rotation policy:** Every successful refresh issues a **new refresh token** and invalidates the previous one (single-use rotation).

---

## 7. Logout Flow

```
Client                      API                         Database
  |                           |                              |
  |-- POST /auth/logout ------>|                              |
  |   Authorization: Bearer   |-- Validate JWT (middleware)  |
  |                           |-- Extract sub (UserId)       |
  |                           |-- Set RefreshToken = NULL -->|
  |                           |-- Set RefreshTokenExpiresAt  |
  |                           |   = NULL                  -->|
  |<-- 200 { message } -------|                              |
```

- JWT access tokens remain technically valid until natural expiry (15 min)
- Refresh token is immediately revoked in DB
- Future: JWT revocation via `jti` blacklist in Redis

---

## 8. Route Protection Flow

```
Incoming Request
      |
      v
[AuthMiddleware]
      |
      |-- Extract Bearer token from Authorization header
      |-- If missing → 401 Unauthorized
      |
      v
[JWT Validation]
      |
      |-- Verify signature (HS256 + secret)
      |-- Check exp claim (not expired)
      |-- If invalid/expired → 401 Unauthorized
      |
      v
[Claims Extraction]
      |
      |-- Extract: sub (UserId), role, email
      |-- Inject into HttpContext.User
      |
      v
[IsActive Check] ← optional DB check for sensitive operations
      |
      |-- If IsActive = false → 403 Forbidden
      |
      v
[Controller / Route Handler]
```

---

## 9. Role-Based Access Flow

```
[AuthorizeAttribute] on Controller/Endpoint
      |
      |-- Read HttpContext.User.Claims["role"]
      |
      |-- Match against required role(s):
      |     [Authorize(Roles = "Doctor")]
      |     [Authorize(Roles = "Admin")]
      |     [Authorize(Roles = "Patient,Doctor")]
      |
      |-- Match → proceed to handler
      |-- Mismatch → 403 Forbidden
```

**Role hierarchy (enforced at API layer, not DB):**

```
Admin
  └── Can access: Admin routes, User management, Doctor approval
Doctor
  └── Can access: Doctor routes, Consultation, Prescription
Patient
  └── Can access: Patient routes, Appointment booking, Health records
```

---

## 10. OTP Expiry Flow

```
State: OTP Issued
      |
      |-- OtpExpiresAt = NOW() + 5 minutes
      |
      v
State: Pending Verification
      |
      |-- If verify-otp called within 5 min → proceed
      |-- If verify-otp called after 5 min:
      |     → 400 Bad Request: "OTP has expired"
      |     → OtpCode and OtpExpiresAt remain in DB
      |     → Client must call send-otp again
      |
      v
State: OTP Expired
      |
      |-- Client calls send-otp again
      |-- New OTP overwrites existing OtpCode + OtpExpiresAt
```

---

## 11. Invalid OTP Flow

```
State: Pending Verification
      |
      |-- Client submits wrong OTP code
      |
      v
[Validation]
      |-- OtpCode mismatch → 401 Unauthorized
      |-- Increment attempt counter (future: rate limit)
      |-- OTP fields NOT cleared (allow retry until expiry)
      |
      v
State: Still Pending (until expiry)
```

> **Future hardening:** Track `OtpAttemptCount` on user row — lock OTP after 3 failed attempts within window.

---

## 12. State Transition Diagram

```
[New User]
    |
    | POST /auth/register (Doctor/Admin only)
    v
[Registered — IsVerified: false]
    |
    | POST /auth/send-otp → POST /auth/verify-otp (Patient)
    | POST /auth/login (Doctor/Admin)
    v
[Authenticated — IsVerified: true]
    |
    | Token expires / logout
    v
[Unauthenticated]
    |
    | POST /auth/refresh (within 7 days)
    v
[Re-authenticated]
    |
    | Admin sets IsActive = false
    v
[Deactivated — all auth rejected]
```

---

## 13. Future MFA Flow (Planned)

```
[Login success — MFA enabled]
      |
      v
[MFA Challenge Issued]
      |-- Generate TOTP challenge (Google Authenticator / Authy)
      |-- Return: { mfaRequired: true, mfaToken: <temp token> }
      |
      v
[Client submits TOTP code]
      |-- POST /auth/mfa/verify { mfaToken, totpCode }
      |-- Validate TOTP against MfaSecret (HMAC-SHA1)
      |-- On success → issue full JWT pair
      |-- On failure → 401, increment attempt counter
```

**DB columns required (future):** `MfaEnabled (boolean)`, `MfaSecret (text, encrypted)`
