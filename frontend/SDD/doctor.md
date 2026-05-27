# Doctor Module — Frontend SDD

> **Module:** Doctor  
> **Frontend Path:** `src/modules/doctor/`  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-27

---

## Backend Dependency Reference

This frontend module is **strictly dependent on**:

- `backend/Modules/Doctor/SDD/README.md`
- `backend/Modules/Doctor/SDD/Flow.md`
- `backend/Modules/Doctor/SDD/APIs.md`
- `backend/Modules/Doctor/SDD/Database.md`
- `backend/Modules/Auth/SDD/APIs.md` (login + register endpoints)
- `backend/Modules/Consultation/SDD/APIs.md` (consultation management)

Frontend implementation **must remain synchronized** with backend SDD.

---

## 1. Module Purpose

The Doctor module governs the complete doctor-facing experience:

- Doctor registration and onboarding
- Approval-state–driven UI (Pending / Approved / Rejected / Suspended)
- Professional profile creation and management
- Availability schedule management
- Consultation request management (confirm / reject)
- Active consultation lifecycle (start / complete)
- Dashboard with schedule overview

---

## 2. User Flow

```
Register (POST /api/auth/register)
    ↓
Account Created → Login (POST /api/auth/login)
    ↓
GET /api/doctors/me → Check state
    ├── isProfileCompleted = false → Profile Setup Screen
    └── isProfileCompleted = true
            ├── approvalStatus = Pending   → Pending Approval Screen
            ├── approvalStatus = Rejected  → Rejected Screen
            ├── approvalStatus = Suspended → Suspended Screen
            └── approvalStatus = Approved  → Doctor Dashboard
                    │
                    ├── Manage Availability (GET/POST/PUT/DELETE)
                    │
                    ├── Consultation Requests (GET /api/consultations/requests)
                    │       ↓
                    │   Confirm / Reject
                    │
                    ├── Schedule (GET /api/consultations/schedule)
                    │       ↓
                    │   Appointment Detail → Start → Complete
                    │
                    └── Manage Profile (GET/PUT /api/doctors/me)
```

---

## 3. Screen Flow

```
DoctorRegisterScreen
    ↓
DoctorLoginScreen
    ↓
[State Router]
    ├── ProfileSetupScreen
    │       ↓
    │   PendingApprovalScreen
    │
    ├── PendingApprovalScreen
    ├── RejectedScreen
    ├── SuspendedScreen
    └── DoctorDashboard
            ├── AvailabilityScreen
            ├── ConsultationRequestsScreen
            │       ↓
            │   RequestDetailScreen → Confirm/Reject
            ├── ScheduleScreen
            │       ↓
            │   AppointmentDetailScreen → Start → Complete
            └── DoctorProfileScreen
                    ↓
                EditProfileScreen
```

---

## 4. Route Structure

| Route | Component | Auth | Role | Condition |
|-------|-----------|------|------|-----------|
| `/auth/register` | `DoctorRegisterScreen` | No | — | — |
| `/auth/login` | `CredentialLoginScreen` | No | — | — |
| `/doctor/setup` | `DoctorProfileSetupScreen` | JWT | Doctor | `isProfileCompleted = false` |
| `/doctor/pending` | `PendingApprovalScreen` | JWT | Doctor | `approvalStatus = Pending` |
| `/doctor/rejected` | `RejectedScreen` | JWT | Doctor | `approvalStatus = Rejected` |
| `/doctor/suspended` | `SuspendedScreen` | JWT | Doctor | `approvalStatus = Suspended` |
| `/doctor/dashboard` | `DoctorDashboard` | JWT | Doctor | `approvalStatus = Approved` |
| `/doctor/profile` | `DoctorProfileScreen` | JWT | Doctor | Approved |
| `/doctor/profile/edit` | `EditDoctorProfileScreen` | JWT | Doctor | Approved |
| `/doctor/availability` | `AvailabilityScreen` | JWT | Doctor | Approved |
| `/doctor/requests` | `ConsultationRequestsScreen` | JWT | Doctor | Approved |
| `/doctor/requests/[id]` | `RequestDetailScreen` | JWT | Doctor | Approved |
| `/doctor/schedule` | `ScheduleScreen` | JWT | Doctor | Approved |
| `/doctor/appointments/[id]` | `AppointmentDetailScreen` | JWT | Doctor | Approved |
| `/consultation/video/[roomId]` | `VideoConsultationScreen` | JWT | Doctor | Approved |

---

## 5. Pages & Components Required

### Pages (Next.js App Router)

| File Path | Description |
|-----------|-------------|
| `src/app/(auth)/register/page.tsx` | Doctor registration form |
| `src/app/doctor/setup/page.tsx` | Doctor profile setup (first time) |
| `src/app/doctor/pending/page.tsx` | Awaiting admin approval |
| `src/app/doctor/rejected/page.tsx` | Profile rejected by admin |
| `src/app/doctor/suspended/page.tsx` | Account suspended |
| `src/app/(dashboard)/doctor/dashboard/page.tsx` | Doctor home |
| `src/app/(dashboard)/doctor/profile/page.tsx` | View profile |
| `src/app/(dashboard)/doctor/profile/edit/page.tsx` | Edit profile |
| `src/app/(dashboard)/doctor/availability/page.tsx` | Manage availability |
| `src/app/(dashboard)/doctor/requests/page.tsx` | Consultation requests |
| `src/app/(dashboard)/doctor/requests/[id]/page.tsx` | Request detail |
| `src/app/(dashboard)/doctor/schedule/page.tsx` | Upcoming schedule |
| `src/app/(dashboard)/doctor/appointments/[id]/page.tsx` | Appointment detail |
| `src/app/consultation/video/[roomId]/page.tsx` | Video room |

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| `DoctorRegisterForm` | `components/doctor/` | Registration: name, email, phone, password, confirmPassword |
| `DoctorProfileSetupForm` | `components/doctor/` | Professional profile: specialization, qualification, license, fee, bio, city |
| `ApprovalStatusBanner` | `components/doctor/` | Contextual banner: Pending / Rejected / Suspended |
| `PendingApprovalCard` | `components/doctor/` | Full-screen state: "Your profile is under review." |
| `RejectedStateCard` | `components/doctor/` | Rejection reason + "Edit Profile" CTA |
| `SuspendedStateCard` | `components/doctor/` | Suspension message + "Contact Support" link |
| `DoctorDashboardHeader` | `components/doctor/` | Avatar, name, specialization, rating |
| `DoctorStatsRow` | `components/doctor/` | Cards: pending requests, today's consultations, total consultations |
| `AvailabilitySlotCard` | `components/doctor/` | Day + time range + duration + active toggle + edit/delete |
| `AddSlotModal` | `components/doctor/` | Form: dayOfWeek, startTime, endTime, slotDurationMinutes |
| `EditSlotModal` | `components/doctor/` | Pre-filled slot edit form |
| `DeleteSlotConfirmDialog` | `components/doctor/` | Confirmation dialog before DELETE |
| `ConsultationRequestCard` | `components/doctor/` | Patient name, symptoms preview, date/time, Confirm/Reject actions |
| `RejectConsultationModal` | `components/doctor/` | Reason textarea + Reject confirm |
| `ScheduleCalendarView` | `components/doctor/` | Weekly calendar showing confirmed consultations |
| `ScheduleListView` | `components/doctor/` | Chronological list of upcoming appointments |
| `AppointmentActionBar` | `components/doctor/` | "Start Consultation" / "Complete Consultation" / "Mark No-Show" CTAs |
| `PatientSnapshotCard` | `components/doctor/` | Patient gender, DOB, blood group (from consultation detail) |
| `AddNotesModal` | `components/doctor/` | Clinical notes textarea shown at consultation completion |
| `DoctorProfileCard` | `components/doctor/` | Professional details display |
| `DoctorEditForm` | `components/doctor/` | Partial update form for profile |
| `LanguageTagsInput` | `components/shared/` | Multi-value chip input for languages spoken |

---

## 6. Screen Definitions

### 6.1 Doctor Register Screen

- Form fields: fullName, email, phoneNumber, password, confirmPassword
- Role is hardcoded as `"Doctor"` in request body
- Password strength indicator
- On submit: `POST /api/auth/register`
- On success: "Account created. Please log in and complete your professional profile."
- Error: `409 EMAIL_EXISTS` → inline email field error

### 6.2 Doctor Profile Setup Screen

- Shown immediately after first login when `isProfileCompleted = false`
- Required fields: specialization, qualification, experienceYears, licenseNumber, consultationFee, city
- Optional fields: bio, hospitalName, clinicAddress, state, country, languagesSpoken
- Profile image upload field (optional at setup)
- On submit: `POST /api/doctors/profile`
- On success: redirect to `/doctor/pending` (`approvalStatus = Pending` by default)
- Error `409 LICENSE_DUPLICATE` → inline licenseNumber field error

### 6.3 Pending Approval Screen

- Full-page state with illustration
- Message: "Your profile is under review. Our team will verify your credentials within 24–48 hours."
- Profile summary card (read-only view of submitted details)
- "Edit Profile" CTA → allows updating details while pending (PUT /api/doctors/me)
- Logout button
- Auto-refreshes approval status every 60 seconds (polling `GET /api/doctors/me`)

### 6.4 Rejected Screen

- `ApprovalStatusBanner` with `Rejected` state (red)
- Rejection reason displayed (from admin moderation)
- "Update Your Profile" CTA → opens `EditDoctorProfileScreen`
- Message: "After updating your profile, contact support for re-review."
- Logout button

### 6.5 Suspended Screen

- `ApprovalStatusBanner` with `Suspended` state (orange)
- Message: "Your account has been temporarily suspended. Please contact support."
- No access to dashboard features
- "Contact Support" link (mailto or support page)
- Logout button

### 6.6 Doctor Dashboard

- Header: greeting + stats row (pending requests count, today's appointments)
- "Consultation Requests" section: top 3 pending requests with "View All" link
- "Today's Schedule" section: next 3 confirmed appointments with "View All" link
- Quick action: "Manage Availability" → `/doctor/availability`
- Bottom navigation: Dashboard | Requests | Schedule | Profile

### 6.7 Availability Screen

- Grouped by day of week (Monday–Sunday tabs)
- Each slot: `AvailabilitySlotCard` with toggle, edit, delete
- "Add Slot" FAB button → opens `AddSlotModal`
- API: `GET /api/doctors/availability`
- Add: `POST /api/doctors/availability` — only allowed if `approvalStatus = Approved`
- Toggle: `PUT /api/doctors/availability/{id}` with `isAvailable`
- Delete: `DELETE /api/doctors/availability/{id}` with `DeleteSlotConfirmDialog`

### 6.8 Consultation Requests Screen

- Tab: Pending requests (sorted by scheduled date ascending)
- `ConsultationRequestCard` for each request: patient name, symptoms, date/time, fee
- Tap card → `RequestDetailScreen`
- Inline "Confirm" / "Reject" buttons on card
- API: `GET /api/consultations/requests`

### 6.9 Request Detail Screen

- Full patient + consultation details
- `PatientSnapshotCard`: patient gender, age (derived from DOB), blood group
- Symptoms (full text)
- Scheduled date + time + type (Video / In-Person)
- Fee snapshot
- "Confirm Consultation" green CTA
- "Reject" secondary CTA → opens `RejectConsultationModal`
- API: `GET /api/consultations/{id}`
- Confirm: `PUT /api/consultations/{id}/confirm`
- Reject: `PUT /api/consultations/{id}/reject`

### 6.10 Schedule Screen

- View toggle: Calendar view | List view
- Calendar: weekly view, each day shows confirmed consultations as time blocks
- List: chronological `AppointmentCard` list
- Filter tabs: Today | Upcoming | All
- API: `GET /api/consultations/schedule`

### 6.11 Appointment Detail Screen (Doctor View)

- Consultation detail: patient, date/time, type, symptoms, status
- `ConsultationTimeline` status history
- `AppointmentActionBar` with context-aware CTAs:
  - `Confirmed` → "Start Consultation" button (`PUT /api/consultations/{id}/start`)
  - `InProgress` → "Complete Consultation" button (`PUT /api/consultations/{id}/complete`) + notes textarea
  - `Confirmed` → "Mark No-Show" option
- `JoinVideoButton`: shown if `status = InProgress` and `meetingLink` present
- Cancel button: shown if status is `Pending` or `Confirmed`

### 6.12 Doctor Profile Screen

- Professional details: name, specialization, qualification, experience, license, bio
- Hospital + address
- Languages spoken
- Rating + total consultations (read-only)
- Profile image with upload option
- "Edit Profile" button
- API: `GET /api/doctors/me`

---

## 7. API Integration Mapping

| Frontend Action | Backend API | Method |
|-----------------|-------------|--------|
| Doctor register | `/api/auth/register` | POST |
| Doctor login | `/api/auth/login` | POST |
| Create doctor profile | `/api/doctors/profile` | POST |
| Get own profile | `/api/doctors/me` | GET |
| Update profile | `/api/doctors/me` | PUT |
| Get availability | `/api/doctors/availability` | GET |
| Add availability slot | `/api/doctors/availability` | POST |
| Update availability slot | `/api/doctors/availability/{id}` | PUT |
| Delete availability slot | `/api/doctors/availability/{id}` | DELETE |
| Get consultation requests | `/api/consultations/requests` | GET |
| Confirm consultation | `/api/consultations/{id}/confirm` | PUT |
| Reject consultation | `/api/consultations/{id}/reject` | PUT |
| Get schedule | `/api/consultations/schedule` | GET |
| Get consultation detail | `/api/consultations/{id}` | GET |
| Start consultation | `/api/consultations/{id}/start` | PUT |
| Complete consultation | `/api/consultations/{id}/complete` | PUT |
| Cancel consultation | `/api/consultations/{id}/cancel` | PUT |

---

## 8. State Management Strategy

**Stores:** Zustand in `src/store/`

| Store | Purpose |
|-------|---------|
| `doctorProfileStore` | Cached doctor profile, `approvalStatus`, `isProfileCompleted` |
| `availabilityStore` | Slots list, optimistic toggle state |

**TanStack Query keys:**

| Key | Hook | Purpose |
|-----|------|---------|
| `['doctor', 'profile']` | `useDoctorProfile` | Own profile + approval status |
| `['doctor', 'availability']` | `useDoctorAvailability` | Own slots |
| `['consultations', 'requests']` | `useConsultationRequests` | Pending requests |
| `['consultations', 'schedule']` | `useDoctorSchedule` | Upcoming schedule |
| `['consultation', id]` | `useConsultationDetail` | Single consultation |

- `approvalStatus` polling: `refetchInterval: 60_000` on pending screen only
- Availability: optimistic update on toggle (`isAvailable` toggled locally, confirmed on API response)
- Consultation requests: `refetchOnWindowFocus: true`

---

## 9. Validation Rules

All Zod schemas in `src/modules/doctor/schemas/`.

| Field | Zod Rule | Backend Rule |
|-------|----------|--------------|
| `specialization` | `z.string().min(1).max(256)` | Required, max 256 |
| `qualification` | `z.string().min(1).max(512)` | Required, max 512 |
| `experienceYears` | `z.number().int().min(0).max(80)` | Min 0, max 80 |
| `licenseNumber` | `z.string().min(1)` | Required, unique |
| `consultationFee` | `z.number().min(0)` | Min 0 |
| `city` | `z.string().min(1).max(100)` | Required |
| `dayOfWeek` | `z.number().int().min(0).max(6)` | 0 = Sunday, 6 = Saturday |
| `startTime` | `z.string().regex(/^\d{2}:\d{2}$/)` | HH:mm format |
| `endTime` | Must be after `startTime` | endTime > startTime |
| `slotDurationMinutes` | `z.number().int().min(10).max(120)` | Min 10, max 120 |
| `rejectReason` | `z.string().min(10).max(500)` | Required on reject |

---

## 10. Loading States

| Screen | Loading Behavior |
|--------|-----------------|
| Doctor dashboard | Skeleton stats row + skeleton request cards |
| Availability screen | Skeleton slot cards (3 per day) |
| Consultation requests | Skeleton request cards (3 items) |
| Schedule screen | Skeleton calendar + list |
| Profile screen | Full-page skeleton |
| Modals (confirm/reject) | Button spinner while API call in flight |

---

## 11. Error States

| Status | Scenario | UI |
|--------|----------|----|
| `400` | Validation on profile setup | Inline field errors |
| `403` | Availability add while not Approved | Toast: "You must be approved before managing availability." |
| `403` | Confirm/reject — wrong doctor | Toast: "You are not authorized for this action." |
| `409` | Profile already exists | Redirect to profile view (no re-creation needed) |
| `409` | License duplicate | Inline licenseNumber error: "This license number is already registered." |
| `422` | Confirm already-confirmed consultation | Toast: "This consultation has already been confirmed." |
| `422` | Start consultation not yet confirmed | Toast: "Consultation must be confirmed before starting." |
| Network | Any request fails | Toast with retry button |

---

## 12. Empty States

| Screen | Empty State |
|--------|------------|
| No availability slots | Illustration + "You haven't set your availability yet." + "Add Slot" CTA |
| No consultation requests | Illustration + "No pending consultation requests." |
| No schedule items | Illustration + "No upcoming appointments." |
| Rejected (no reason) | Generic: "Your profile was not approved. Please contact support." |

---

## 13. Approval State UI Rules

The entire doctor dashboard is **gated behind approval status**. Frontend state routing:

| `approvalStatus` | `isProfileCompleted` | Routed To |
|------------------|----------------------|-----------|
| (any) | `false` | `/doctor/setup` |
| `Pending` | `true` | `/doctor/pending` |
| `Rejected` | `true` | `/doctor/rejected` |
| `Suspended` | `true` | `/doctor/suspended` |
| `Approved` | `true` | `/doctor/dashboard` |

- State derived from `GET /api/doctors/me` response immediately after login
- Approval state re-checked on every app load via Zustand-persisted profile
- Suspended doctor **can still view** their past consultations (read-only)

---

## 14. Authorization Rules

- All `/doctor/*` routes guarded by `DoctorGuard`
- Patient or Admin accessing `/doctor/*` → redirected to own dashboard
- Unauthenticated access → `/auth/role`
- `approvalStatus = Suspended / Rejected / Pending` blocks all write operations (API-enforced; frontend hides CTAs)

---

## 15. Responsive Design Notes

- Dashboard stats row: 1-col on mobile, 3-col on `md+`
- Availability screen: day tabs on mobile → horizontal scroll; day columns on `lg+`
- Calendar view: hidden on mobile (replaced by list view); shown on `md+`
- Request cards: full-width, action buttons below content on mobile
- Modals: full-screen bottom sheet on mobile, centered dialog on desktop
- Video room: always full-screen

---

## 16. Future Scalability Notes

- **AI consultation summary**: post-completion, call `ai-services` FastAPI to generate clinical notes draft
- **Rating/Review display**: wire `rating` and `totalReviews` fields from `GET /api/doctors/me` to dashboard stats
- **Earnings dashboard**: future `/api/doctors/earnings` endpoint — add "Earnings" tab to bottom navigation
- **Leave management**: future availability override for holidays — "Block Date" feature in `AvailabilityScreen`
- **Consultation re-queue**: rejected profile auto re-queues for admin review after doctor edits profile
