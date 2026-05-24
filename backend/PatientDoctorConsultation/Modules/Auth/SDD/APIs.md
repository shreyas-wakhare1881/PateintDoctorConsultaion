# Auth Module — API Contract Specification

> **Module:** Auth  
> **Base Path:** `/api/auth`  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-24

---

## Quick Reference

| # | Method | Route | Auth Required | Purpose |
|---|--------|-------|---------------|---------|
| 1 | POST | `/api/auth/send-otp` | None | Send OTP to patient phone number (E.164) |
| 2 | POST | `/api/auth/verify-otp` | None | Verify OTP → issue JWT |
| 3 | POST | `/api/auth/register` | None | Register Doctor (pending approval) |
| 4 | POST | `/api/auth/login` | None | Login for Doctor / Admin |
| 5 | POST | `/api/auth/refresh` | None | Rotate refresh token → new JWT |
| 6 | POST | `/api/auth/logout` | Bearer JWT | Revoke refresh token |
| 7 | GET  | `/api/auth/me` | Bearer JWT | Get current authenticated user |
| 8 | PUT  | `/api/auth/profile` | Bearer JWT | Update profile fields |

---

## Standard Response Envelope

All responses follow this envelope:

```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error
{
  "success": false,
  "message": "Error description",
  "errors": { "field": ["validation message"] }
}
```

---

## 1. Send OTP

**`POST /api/auth/send-otp`**

> Generates and sends a 6-digit numeric OTP to the provided patient phone number. Auto-creates a lightweight Patient account if no account exists for this phone number. **Patient-only flow** — Doctors/Admins must not use this endpoint.

### Request Body
```json
{
  "phoneNumber": "+919876543210"
}
```

### Validation Rules
| Field         | Rule |
|---------------|------|
| `phoneNumber` | Required · E.164 format (`+[country code][number]`) · 8–15 digits total |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully. Valid for 5 minutes.",
    "expiresAt": "2026-05-24T12:15:00Z"
  }
}
```

### Error Responses

| Status | Code | Scenario |
|--------|------|----------|
| `400` | `VALIDATION_ERROR` | Invalid or missing phone number format |
| `400` | `ROLE_NOT_ALLOWED` | Phone belongs to a Doctor/Admin account |
| `403` | `ACCOUNT_INACTIVE` | Patient account is deactivated |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many OTP requests (future) |

### Notes
- OTP is valid for **5 minutes** from issuance
- Subsequent calls overwrite the previous OTP
- Auto-creates Patient User on first call (`FullName = ""`, `Email = null`, `IsVerified = false`)
- In dev/test: set `Otp:DevFixedCode` in config to get a predictable OTP (e.g. `"123456"`)

---

## 2. Verify OTP

**`POST /api/auth/verify-otp`**

> Validates submitted OTP against stored OtpCode. On success, sets `IsVerified = true`, clears OTP fields, and issues a JWT access token + refresh token pair. **Patient-only flow.**

### Request Body
```json
{
  "phoneNumber": "+919876543210",
  "otp": "482910"
}
```

### Validation Rules
| Field         | Rule |
|---------------|------|
| `phoneNumber` | Required · E.164 format |
| `otp`         | Required · Exactly 6 numeric digits |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "d2f4a8c1-...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "fullName": "",
      "email": null,
      "phoneNumber": "+919876543210",
      "role": "Patient",
      "isVerified": true
    }
  }
}
```

### Error Responses

| Status | Code | Scenario |
|--------|------|----------|
| `400` | `VALIDATION_ERROR` | Missing or malformed fields |
| `401` | `INVALID_CREDENTIALS` | Phone number not found |
| `401` | `INVALID_OTP` | OTP code does not match |
| `401` | `OTP_EXPIRED` | OTP window has passed |
| `401` | `NO_PENDING_OTP` | send-otp was never called first |
| `403` | `ACCOUNT_INACTIVE` | Account is disabled |
}
```

### Validation Rules
| Field   | Rule |
|---------|------|
| `email` | Required · Valid email format |
| `otp`   | Required · Exactly 6 digits · Numeric string |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "d2f4a8c1-...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "fullName": "Ananya Sharma",
      "email": "patient@example.com",
      "role": "Patient",
      "isVerified": true
    }
  }
}
```

### Error Responses

| Status | Code | Scenario |
|--------|------|----------|
| `400` | `VALIDATION_ERROR` | Missing or malformed fields |
| `401` | `INVALID_OTP` | OTP code does not match |
| `410` | `OTP_EXPIRED` | OTP window has passed |
| `403` | `ACCOUNT_INACTIVE` | Account is disabled |

---

## 3. Register

**`POST /api/auth/register`**

> Registers a new Doctor account. Account is created with `IsVerified = false` and `IsActive = false` pending admin approval. Patients are registered via OTP flow — no separate register endpoint for Patient role.

### Request Body
```json
{
  "fullName": "Dr. Rohit Verma",
  "email": "doctor@example.com",
  "phoneNumber": "+91-9876543210",
  "password": "SecurePass@123",
  "confirmPassword": "SecurePass@123",
  "role": "Doctor"
}
```

### Validation Rules
| Field             | Rule |
|-------------------|------|
| `fullName`        | Required · Min 2 chars · Max 256 chars · No special chars |
| `email`           | Required · Valid format · Max 256 chars · Must be unique |
| `phoneNumber`     | Optional · E.164 format (+CountryCode-Number) |
| `password`        | Required · Min 8 chars · Must contain: uppercase, lowercase, digit, special char |
| `confirmPassword` | Required · Must match `password` |
| `role`            | Required · Must be `"Doctor"` (Admin registration is seeded only) |

### Success Response — `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "doctor@example.com",
    "role": "Doctor",
    "isVerified": false,
    "isActive": false
  },
  "message": "Registration successful. Awaiting admin approval."
}
```

### Error Responses

| Status | Code | Scenario |
|--------|------|----------|
| `400` | `VALIDATION_ERROR` | Any field fails validation |
| `409` | `EMAIL_ALREADY_EXISTS` | Email is already registered |
| `400` | `ROLE_NOT_ALLOWED` | Attempted Admin self-registration |

---

## 4. Login

**`POST /api/auth/login`**

> Authenticates Doctor or Admin using email + password credentials.

### Request Body
```json
{
  "email": "doctor@example.com",
  "password": "SecurePass@123",
  "role": "Doctor"
}
```

### Validation Rules
| Field      | Rule |
|------------|------|
| `email`    | Required · Valid format |
| `password` | Required · Min 1 char (exact validation deferred to service) |
| `role`     | Required · Must be `"Doctor"` or `"Admin"` |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "d2f4a8c1-...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "fullName": "Dr. Rohit Verma",
      "email": "doctor@example.com",
      "role": "Doctor",
      "isVerified": true
    }
  }
}
```

### Error Responses

| Status | Code | Scenario |
|--------|------|----------|
| `400` | `VALIDATION_ERROR` | Missing or invalid fields |
| `401` | `INVALID_CREDENTIALS` | Email/password mismatch |
| `403` | `ACCOUNT_INACTIVE` | Account deactivated by admin |
| `403` | `ACCOUNT_NOT_VERIFIED` | Doctor account pending approval |
| `403` | `ROLE_MISMATCH` | Submitted role does not match DB role |

---

## 5. Refresh Token

**`POST /api/auth/refresh`**

> Accepts a valid refresh token and issues a new JWT access token + rotated refresh token.

### Request Body
```json
{
  "refreshToken": "d2f4a8c1-9b3e-4f7a-b2c5-1d6e8f90a234"
}
```

### Validation Rules
| Field          | Rule |
|----------------|------|
| `refreshToken` | Required · Non-empty string · Valid UUID format |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a1b2c3d4-...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

### Error Responses

| Status | Code | Scenario |
|--------|------|----------|
| `400` | `VALIDATION_ERROR` | Missing or malformed token |
| `401` | `INVALID_REFRESH_TOKEN` | Token not found or hash mismatch |
| `401` | `REFRESH_TOKEN_EXPIRED` | Token TTL has elapsed |
| `403` | `ACCOUNT_INACTIVE` | User deactivated since token was issued |

---

## 6. Logout

**`POST /api/auth/logout`**

> Revokes the current session's refresh token. Access token remains valid until natural expiry.

### Request Headers
```
Authorization: Bearer <accessToken>
```

### Request Body
```json
{
  "refreshToken": "d2f4a8c1-9b3e-4f7a-b2c5-1d6e8f90a234"
}
```

### Validation Rules
| Field          | Rule |
|----------------|------|
| `refreshToken` | Required · Non-empty string |

### Authentication
- **Required:** Valid Bearer JWT in `Authorization` header

### Success Response — `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

### Error Responses

| Status | Code | Scenario |
|--------|------|----------|
| `401` | `UNAUTHORIZED` | Missing or invalid JWT |
| `400` | `VALIDATION_ERROR` | Missing refreshToken in body |

---

## 7. Get Current User

**`GET /api/auth/me`**

> Returns the authenticated user's profile based on JWT claims. No DB call in MVP — resolved from JWT payload.

### Request Headers
```
Authorization: Bearer <accessToken>
```

### Authentication
- **Required:** Valid Bearer JWT

### Allowed Roles
- `Patient`, `Doctor`, `Admin`

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "fullName": "Dr. Rohit Verma",
    "email": "doctor@example.com",
    "phoneNumber": "+91-9876543210",
    "role": "Doctor",
    "isActive": true,
    "isVerified": true,
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

### Error Responses

| Status | Code | Scenario |
|--------|------|----------|
| `401` | `UNAUTHORIZED` | Missing or expired JWT |

---

## 8. Update Profile

**`PUT /api/auth/profile`**

> Updates mutable profile fields for the authenticated user. Email and Role are immutable via this endpoint.

### Request Headers
```
Authorization: Bearer <accessToken>
```

### Request Body
```json
{
  "fullName": "Dr. Rohit K. Verma",
  "phoneNumber": "+91-9876543210"
}
```

### Validation Rules
| Field         | Rule |
|---------------|------|
| `fullName`    | Optional · Min 2 chars · Max 256 chars · No special chars |
| `phoneNumber` | Optional · E.164 format · Unique across users |

### Authentication
- **Required:** Valid Bearer JWT

### Allowed Roles
- `Patient`, `Doctor`, `Admin`

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "fullName": "Dr. Rohit K. Verma",
    "email": "doctor@example.com",
    "phoneNumber": "+91-9876543210",
    "updatedAt": "2026-05-23T08:45:00Z"
  },
  "message": "Profile updated successfully."
}
```

### Error Responses

| Status | Code | Scenario |
|--------|------|----------|
| `400` | `VALIDATION_ERROR` | Field fails validation |
| `401` | `UNAUTHORIZED` | Missing or expired JWT |
| `409` | `PHONE_ALREADY_EXISTS` | Phone number taken by another user |

---

## Common HTTP Status Codes Reference

| Status | Meaning |
|--------|---------|
| `200` | OK — Request succeeded |
| `201` | Created — Resource created |
| `400` | Bad Request — Validation failed |
| `401` | Unauthorized — Auth required or credentials invalid |
| `403` | Forbidden — Auth valid but access denied |
| `404` | Not Found — Resource does not exist |
| `409` | Conflict — Duplicate resource |
| `410` | Gone — Resource expired (OTP) |
| `429` | Too Many Requests — Rate limit exceeded |
| `500` | Internal Server Error — Unhandled exception |
