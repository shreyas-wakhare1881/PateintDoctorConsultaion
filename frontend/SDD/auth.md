# Auth Module — Frontend SDD

> **Module:** Auth
> **Frontend Path:** `src/modules/auth/`, `src/app/(auth)/`, `src/app/login/`, `src/app/verify-otp/`, `src/app/doctor/`
> **Version:** 2.0
> **Architecture:** Patient-First
> **Status:** Active
> **Last Updated:** 2026-05-27

---

## LIVING DOCUMENT NOTICE

This SDD is a **living source of truth**. Every meaningful auth architecture change
(route structure, UX flow, role entry, redirect behavior) MUST be reflected here.
Implementation and SDD must ALWAYS remain synchronized.

---

## Backend Dependency Reference

- `backend/Modules/Auth/SDD/README.md`
- `backend/Modules/Auth/SDD/Flow.md`
- `backend/Modules/Auth/SDD/APIs.md`
- `backend/Modules/Auth/SDD/Database.md`

---

## 1. Architecture — Patient-First (v2)

PatientDoctorConsultation is a **PATIENT-FIRST healthcare platform**.

**Primary entry: `/login` (patient OTP flow)**
Doctor and Admin access via secondary flows.
Role selection screen REMOVED.

```
Default App Entry:
  / → splash → /login  (for unauthenticated users)

Patient Flow:    /login → /verify-otp → /patient/dashboard (or /patient/setup)
Doctor Flow:     /doctor → /doctor/login → /doctor/dashboard
Admin Flow:      /admin/login (hidden, internal only)
```

---

## 2. Route Structure (v2)

### Patient Auth (Primary)

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | `src/app/login/page.tsx` | Patient-first login (phone OTP) — primary entry point |
| `/verify-otp` | `src/app/verify-otp/page.tsx` | OTP verification (6-box, auto-submit, shake on error) |
| `/patient/setup` | `src/app/patient/setup/page.tsx` | First-time profile setup (behind PatientGuard) |

### Doctor Auth (Secondary)

| Route | Component | Description |
|-------|-----------|-------------|
| `/doctor` | `src/app/doctor/page.tsx` | Doctor landing page (public, marketing) |
| `/doctor/login` | `src/app/doctor/login/page.tsx` | Doctor credential login (email + password) |
| `/doctor/register` | `src/app/doctor/register/page.tsx` | Doctor registration (with form persistence) |
| `/doctor/pending` | `src/app/doctor/pending/page.tsx` | Application under review |
| `/doctor/rejected` | `src/app/doctor/rejected/page.tsx` | Application rejected |
| `/doctor/suspended` | `src/app/doctor/suspended/page.tsx` | Account suspended |

### Admin Auth (Internal / Hidden)

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/login` | `src/app/admin/login/page.tsx` | Admin portal (dark theme, no public visibility) |

### Legacy Routes (Redirects)

| Old Route | Redirects To | Notes |
|-----------|-------------|-------|
| `/auth/role` | `/login` | Role selection removed |
| `/auth/patient/login` | `/login` | Renamed |
| `/auth/patient/otp` | `/verify-otp` | Renamed |
| `/auth/login` | `/doctor/login` | Renamed |
| `/auth/register` | `/doctor/register` | Renamed |

---

## 3. Component Library (`src/components/auth/`)

| Component | Purpose |
|-----------|---------|
| `AuthCard` | Framer Motion animated card wrapper |
| `AuthHeader` | h1 + subtitle |
| `BrandMark` | SVG teal cross + "HealthConsult" wordmark |
| `OtpInput` | 6-box: auto-advance, paste, backspace, aria labels |
| `OtpResendTimer` | Countdown 5 min, resend button |
| `AuthSkeleton` | Loading placeholders (login/otp/setup variants) |
| `SessionExpiredModal` | Session expiry modal with auto-redirect countdown |
| `AuthErrorBanner` | AnimatePresence error strip (aria-live) |
| `FormField` | label + children + error wrapper |
| `AuthInput` | forwardRef input, error state, prefix/suffix |
| `AuthButton` | h-12, loading spinner, variants |
| `PasswordInput` | Show/hide toggle |
| `PasswordStrength` | 5-bar score meter |
| `AuthIllustration` | SVG: patient / doctor / success / pending |

---

## 4. Auth Flows (v2)

### 4.1 Patient Login Flow

```
/login
  └─ Enter phone (country code + number)
  └─ POST /api/auth/send-otp
  └─ sessionStorage.setItem('pdc_otp_phone', fullPhone)
  └─ router.push('/verify-otp')

/verify-otp
  └─ Read phone from sessionStorage (missing → redirect /login)
  └─ 6-box OTP input
  └─ Auto-submit on 6th digit (useEffect)
  └─ POST /api/auth/verify-otp
  └─ On success:
       └─ login(user, accessToken, refreshToken) [Zustand]
       └─ sessionStorage.removeItem('pdc_otp_phone')
       └─ GET /api/patients/me
            ├─ 200 → /patient/dashboard
            └─ 404 → /patient/setup
```

### 4.2 Doctor Login Flow

```
/doctor/login
  └─ POST /api/auth/login { email, password, role: 'Doctor' }
  └─ On success:
       └─ GET /api/doctors/me → approvalStatus
            ├─ Approved   → /doctor/dashboard
            ├─ Pending    → /doctor/pending
            ├─ Rejected   → /doctor/rejected
            └─ Suspended  → /doctor/suspended
```

### 4.3 Doctor Registration Flow

```
/doctor/register
  └─ Form state persisted to sessionStorage (useFormPersistence)
  └─ POST /api/auth/register { fullName, email, phoneNumber?, password, confirmPassword, role: 'Doctor' }
  └─ On success: show "Application Submitted" state
  └─ Doctor cannot login until admin approves
```

### 4.4 Admin Login Flow

```
/admin/login (hidden route — not linked publicly)
  └─ POST /api/auth/login { email, password, role: 'Admin' }
  └─ On success → /admin/dashboard
```

---

## 5. Session Lifecycle

### Token Storage
- `accessToken` — in-memory only (Zustand, lost on refresh) — intentional
- `refreshToken` — persisted via Zustand `persist` under key `pdc_rt`

### Session Check (App Startup)

Provider: `src/providers/auth-provider.tsx`

```
onMount:
  1. Read refreshToken from localStorage (pdc_rt)
  2. If present → POST /api/auth/refresh
       ├─ Success → login(user, accessToken, refreshToken) → isSessionLoading = false
       └─ Fail → clearSession() → redirect /login
  3. If absent → setSessionLoading(false) → root page redirects to /login
```

### Session Expired (v2)

When any API call returns 401 and refresh also fails:
- Show `SessionExpiredModal` (calm healthcare tone)
- Auto-redirect to `/login` after 8s countdown
- Force `clearSession()` before redirect
- Remove `pdc_otp_phone` from sessionStorage

---

## 6. Authorization Guards

| Guard | Route Restriction | Unauthenticated Redirect |
|-------|------------------|--------------------------|
| `AuthGuard` | Any authenticated route | `/login` |
| `PatientGuard` | `role=Patient` only | `/login` |
| `DoctorGuard` | `role=Doctor` only | `/login` |
| `AdminGuard` | `role=Admin` only | `/login` |

---

## 7. OTP UX Specification

### Auto-Submit
- When 6th digit is entered, `useEffect` triggers `handleVerify(otp)` automatically
- `autoSubmitRef` prevents double-submit race condition

### Error Feedback
- Shake animation (Framer Motion `x` keyframes) on wrong OTP
- Error clears on next digit input
- Attempt counter tracked (changes error copy at attempt >= 2)

### Paste Support
- Full 6-digit paste supported: digits auto-distributed, focus jumps to last

### Resend
- 5-minute countdown timer
- Resend clears OTP, resets timer key, resets attempt count

---

## 8. Form Persistence (Doctor Registration)

Hook: `src/hooks/useFormPersistence.ts`

- Persists to `sessionStorage` key `pdc_form_doctor-register`
- Debounced 600ms on every form change
- Password fields NEVER persisted (security)
- Auto-restored on mount
- `clearPersisted()` called on successful submission

---

## 9. Network Recovery

Component: `src/components/shared/offline-banner.tsx`

- Listens to `navigator.onLine` + `online`/`offline` events
- Shows amber banner: "No internet connection…"
- Shows green banner: "You're back online!" (auto-hides after 3s)
- Included in `AuthLayout` for all auth screens

---

## 10. Analytics Foundation

Hook: `src/hooks/useAuthAnalytics.ts`

Events tracked (console.debug in dev, ready for real provider):
- `auth:login_success` — method, userId
- `auth:login_failed` — method, reason
- `auth:otp_requested` — phone (masked)
- `auth:otp_verify_failed` — reason, attempt
- `auth:otp_resent` — phone (masked)
- `auth:doctor_registration_started`
- `auth:doctor_registration_submitted` — email domain
- `auth:doctor_registration_failed` — reason
- `auth:session_expired` — userId
- `auth:logout` — userId, role

To integrate a real provider: replace `console.debug` in `track()` with provider calls.

---

## 11. Accessibility Hardening

All auth screens implement:
- `role="alert"` + `aria-live="assertive"` on error banners
- `aria-invalid` on invalid form fields
- `aria-describedby` linking fields to error messages
- `aria-label` on all icon buttons and OTP boxes
- `aria-busy` on loading buttons
- `autoFocus` management (phone field on login, OTP box on verify)
- `focus-visible` ring on all interactive elements
- Logical tab order (no `tabIndex > 0`)
- `htmlFor` + `id` on all label/input pairs
- `autoFocus` on SessionExpiredModal CTA button

---

## 12. Trust + Legal UX

All auth screens include:
- Terms of Service link (`/terms`)
- Privacy Policy link (`/privacy`)
- Support link (`/` or `mailto:support@healthconsult.com`)
- Security trust indicators (256-bit SSL, HIPAA-aligned, Privacy-safe)
- "Your healthcare data is encrypted and protected." footer copy
- AuthLayout footer: Terms · Privacy · Support

---

## 13. Validation Schemas (`src/modules/auth/schemas/auth.schema.ts`)

| Schema | Fields | Notes |
|--------|--------|-------|
| `patientLoginSchema` | `phoneNumber` | E.164 via string min/max |
| `otpVerifySchema` | `phoneNumber`, `otp` | 6-digit numeric |
| `credentialLoginSchema` | `email`, `password`, `role` | role: Doctor\|Admin |
| `doctorRegisterSchema` | `fullName`, `email`, `phoneNumber?`, `password`, `confirmPassword`, `role: Doctor` | password: min8 + uppercase + lowercase + digit + special |
| `patientSetupSchema` | `gender`, `dateOfBirth`, `bloodGroup?`, `height?`, `weight?`, `city?` | |

---

## 14. Route Constants (`src/config/routes.ts`)

```typescript
ROUTES.login          = '/login'           // patient-first entry
ROUTES.verifyOtp      = '/verify-otp'      // OTP verification
ROUTES.doctor.login   = '/doctor/login'    // doctor credential login
ROUTES.doctor.register= '/doctor/register' // doctor registration
ROUTES.doctor.landing = '/doctor'          // doctor public landing
UNAUTHENTICATED_REDIRECT = '/login'        // all guards redirect here
```

