# Patient Module — Frontend SDD

> **Module:** Patient  
> **Frontend Path:** `src/modules/patient/`  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-27

---

## Backend Dependency Reference

This frontend module is **strictly dependent on**:

- `backend/Modules/Patient/SDD/README.md`
- `backend/Modules/Patient/SDD/Flow.md`
- `backend/Modules/Patient/SDD/APIs.md`
- `backend/Modules/Patient/SDD/Database.md`
- `backend/Modules/Doctor/SDD/APIs.md` (doctor discovery endpoints)
- `backend/Modules/Consultation/SDD/APIs.md` (booking + appointment endpoints)

Frontend implementation **must remain synchronized** with backend SDD.

---

## 1. Module Purpose

The Patient module covers the complete patient-facing experience:

- Patient profile creation and management
- Doctor discovery (search + filters)
- Doctor profile view and availability display
- Consultation booking flow
- Appointment management (upcoming, history, cancel)
- Video consultation join flow

---

## 2. User Flow

```
Post-Login (OTP Verified)
    │
    ▼
GET /api/patients/me
    ├── 404 → Profile Setup Screen
    └── 200 → Patient Dashboard
              │
              ├── Search Doctors (GET /api/doctors?filters)
              │       ↓
              │   Apply Filters → Doctor List
              │       ↓
              │   Doctor Profile (GET /api/doctors/{id})
              │       ↓
              │   Select Slot → Book Consultation (POST /api/consultations)
              │
              ├── Upcoming Appointments (GET /api/consultations/my?status=Confirmed)
              │       ↓
              │   Appointment Detail → Join Video Room
              │
              ├── Consultation History (GET /api/consultations/my?status=Completed)
              │
              └── My Profile → Edit (PUT /api/patients/me)
```

---

## 3. Screen Flow

```
PatientDashboard
    ├── DoctorSearchScreen
    │       ↓
    │   DoctorListScreen (paginated)
    │       ↓
    │   DoctorProfileScreen
    │       ↓
    │   BookingScreen
    │       ↓
    │   BookingConfirmScreen
    │
    ├── UpcomingAppointmentsScreen
    │       ↓
    │   AppointmentDetailScreen
    │       ↓
    │   VideoConsultationScreen
    │
    ├── ConsultationHistoryScreen
    │       ↓
    │   ConsultationDetailScreen
    │
    └── PatientProfileScreen
            ↓
        EditProfileScreen
```

---

## 4. Route Structure

| Route | Component | Auth | Role |
|-------|-----------|------|------|
| `/patient/dashboard` | `PatientDashboard` | JWT | Patient |
| `/patient/setup` | `PatientProfileSetupScreen` | JWT | Patient |
| `/patient/profile` | `PatientProfileScreen` | JWT | Patient |
| `/patient/profile/edit` | `EditPatientProfileScreen` | JWT | Patient |
| `/patient/doctors` | `DoctorSearchScreen` | JWT | Patient |
| `/patient/doctors/[doctorId]` | `DoctorProfileScreen` | JWT | Patient |
| `/patient/book/[doctorId]` | `BookingScreen` | JWT | Patient |
| `/patient/appointments` | `UpcomingAppointmentsScreen` | JWT | Patient |
| `/patient/appointments/[id]` | `AppointmentDetailScreen` | JWT | Patient |
| `/patient/history` | `ConsultationHistoryScreen` | JWT | Patient |
| `/consultation/video/[roomId]` | `VideoConsultationScreen` | JWT | Patient |

---

## 5. Pages & Components Required

### Pages (Next.js App Router)

| File Path | Description |
|-----------|-------------|
| `src/app/(dashboard)/patient/dashboard/page.tsx` | Patient home dashboard |
| `src/app/patient/setup/page.tsx` | First-time profile creation |
| `src/app/(dashboard)/patient/profile/page.tsx` | View profile |
| `src/app/(dashboard)/patient/profile/edit/page.tsx` | Edit profile form |
| `src/app/(dashboard)/patient/doctors/page.tsx` | Doctor search + list |
| `src/app/(dashboard)/patient/doctors/[doctorId]/page.tsx` | Doctor profile |
| `src/app/(dashboard)/patient/book/[doctorId]/page.tsx` | Booking flow |
| `src/app/(dashboard)/patient/appointments/page.tsx` | Upcoming appointments |
| `src/app/(dashboard)/patient/appointments/[id]/page.tsx` | Appointment detail |
| `src/app/(dashboard)/patient/history/page.tsx` | Consultation history |
| `src/app/consultation/video/[roomId]/page.tsx` | Video room |

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| `PatientDashboardHeader` | `components/patient/` | Greeting, profile avatar, notification bell |
| `QuickActionCards` | `components/patient/` | "Find Doctor", "Upcoming", "History" quick access |
| `DoctorSearchBar` | `components/patient/` | Text search input with debounce |
| `DoctorFilterPanel` | `components/patient/` | Slide-over panel: city, specialization, language, fee range |
| `DoctorCard` | `components/patient/` | List card: avatar, name, specialization, fee, rating, city |
| `DoctorCardSkeleton` | `components/patient/` | Loading skeleton for `DoctorCard` |
| `DoctorProfileHeader` | `components/patient/` | Doctor avatar, name, specialization, rating, fee |
| `DoctorAvailabilityGrid` | `components/patient/` | Day-of-week availability display |
| `SlotSelector` | `components/patient/` | Time slot picker for chosen day |
| `BookingForm` | `components/patient/` | Symptoms textarea, consultation type toggle, follow-up checkbox |
| `BookingConfirmCard` | `components/patient/` | Summary before confirm: doctor, date, time, fee |
| `AppointmentCard` | `components/patient/` | Consultation card: status badge, doctor info, date/time, actions |
| `AppointmentStatusBadge` | `components/shared/` | Color-coded: Pending/Confirmed/Completed/Cancelled/Rejected |
| `AppointmentDetailView` | `components/patient/` | Full consultation detail: symptoms, notes, timeline |
| `ConsultationTimeline` | `components/patient/` | Vertical status history timeline |
| `CancelConsultationModal` | `components/patient/` | Modal with reason textarea + confirm button |
| `JoinConsultationBanner` | `components/patient/` | "Join Now" CTA shown when status=Confirmed and time is near |
| `PatientProfileCard` | `components/patient/` | Health stats: blood group, DOB, height, weight |
| `PatientEditForm` | `components/patient/` | Partial update form for patient profile |
| `EmptyStateIllustration` | `components/shared/` | Generic empty state with icon + message |
| `PaginationControls` | `components/shared/` | Page number + prev/next controls |

---

## 6. Screen Definitions

### 6.1 Patient Dashboard

- Greeting header: "Good morning, {fullName}"
- Quick action cards: Find a Doctor | Upcoming | History
- "Upcoming Consultation" preview card (next confirmed appointment)
- Profile completion nudge banner if `isProfileCompleted = false`
- Bottom navigation: Home | Search | Appointments | Profile

### 6.2 Doctor Search Screen

- Sticky search bar at top with debounce (300ms)
- Filter chip row: City, Specialization, Language, Fee
- "Filter" button opens `DoctorFilterPanel` slide-over
- Results: paginated `DoctorCard` list
- Pagination: "Load More" button or page controls (`page`, `pageSize=10`)
- API: `GET /api/doctors?city=&specialization=&language=&minFee=&maxFee=&page=`
- **Suspended/invisible doctors never appear** (backend `IsPubliclyVisible = true` filter)

### 6.3 Doctor Profile Screen

- Profile header: avatar, name, specialization, hospital, city
- Stats row: experience, rating, reviews, consultations
- Bio section
- Languages spoken chips
- Consultation fee + "Book Consultation" CTA
- Availability section: tabbed by day of week
- API: `GET /api/doctors/{doctorId}`

### 6.4 Booking Screen

- Doctor mini-card at top (non-scrollable header)
- Day picker → slot time grid (`DoctorAvailabilityGrid`)
- Consultation type toggle: Video | In-Person
- Symptoms textarea (required, min 10 chars)
- Follow-up toggle: if ON, show parent consultation selector
- Fee summary at bottom
- "Confirm Booking" CTA
- API: `POST /api/consultations`

### 6.5 Booking Confirm Screen

- Order summary: doctor name, date, time, fee snapshot
- Status chip: "Pending — Awaiting Doctor Confirmation"
- "View Appointment" and "Go to Dashboard" CTAs
- No additional API call — displays response from booking POST

### 6.6 Upcoming Appointments Screen

- Tab bar: All | Pending | Confirmed
- List of `AppointmentCard` components, sorted by scheduledDate ascending
- "Join Now" CTA visible on Confirmed cards when within 15 min of scheduled time
- Cancel button on Pending/Confirmed cards
- API: `GET /api/consultations/my?status=Pending|Confirmed&page=`

### 6.7 Appointment Detail Screen

- Full detail view: doctor info, date/time, symptoms, notes, meeting link
- `AppointmentStatusBadge` at top
- `ConsultationTimeline` showing status history
- "Join Consultation" CTA if `status = Confirmed` and `meetingLink` present
- "Cancel Appointment" CTA if status is Pending or Confirmed
- `CancelConsultationModal` on cancel tap
- API: `GET /api/consultations/{id}`

### 6.8 Consultation History Screen

- Tabs: Completed | Cancelled | Rejected | No-Show
- `AppointmentCard` list (no action buttons — read-only)
- "Book Follow-up" button on Completed consultations
- API: `GET /api/consultations/my?status=Completed|Cancelled|Rejected&page=`

### 6.9 Patient Profile Screen

- Avatar + fullName + email + phone
- Health vitals card: blood group, DOB, height, weight
- Medical info accordion: allergies, chronic diseases
- Emergency contact section
- Address section
- "Edit Profile" button → navigates to edit screen
- API: `GET /api/patients/me`

### 6.10 Edit Patient Profile Screen

- Pre-populated form from current profile data
- All fields optional (partial update)
- Zod validation before submit
- API: `PUT /api/patients/me`

---

## 7. API Integration Mapping

| Frontend Action | Backend API | Method |
|-----------------|-------------|--------|
| Create patient profile | `/api/patients/profile` | POST |
| Get own profile | `/api/patients/me` | GET |
| Update profile | `/api/patients/me` | PUT |
| Search doctors | `/api/doctors` | GET |
| View doctor profile | `/api/doctors/{doctorId}` | GET |
| Book consultation | `/api/consultations` | POST |
| Get my consultations | `/api/consultations/my` | GET |
| Get consultation detail | `/api/consultations/{id}` | GET |
| Cancel consultation | `/api/consultations/{id}/cancel` | PUT |
| Get status history | `/api/consultations/{id}/history` | GET |

---

## 8. State Management Strategy

**Stores:** Zustand in `src/store/`

| Store | Purpose |
|-------|---------|
| `patientProfileStore` | Cached patient profile data, `isProfileCompleted` flag |
| `doctorSearchStore` | Active filters, search query, current page |
| `bookingStore` | Selected doctor, slot, symptoms, consultationType (ephemeral) |

**TanStack Query keys** (defined in `src/modules/patient/hooks/`):

| Key | Hook | Purpose |
|-----|------|---------|
| `['patient', 'profile']` | `usePatientProfile` | Own profile |
| `['doctors', filters]` | `useDoctorSearch` | Doctor list with filters |
| `['doctor', doctorId]` | `useDoctorProfile` | Single doctor profile |
| `['consultations', 'my', status]` | `useMyConsultations` | Patient's consultations |
| `['consultation', id]` | `useConsultationDetail` | Single consultation |

- Doctor search results are **cached for 5 minutes** (stale data acceptable for browsing)
- Consultation list is **refetched on window focus** (fresh status data required)

---

## 9. Validation Rules

All Zod schemas in `src/modules/patient/schemas/`.

| Field | Zod Rule | Source |
|-------|----------|--------|
| `gender` | `z.enum(['Male','Female','Other','PreferNotToSay']).optional()` | Backend enum |
| `dateOfBirth` | `z.string().refine(isPastDate)` | Must be past date |
| `bloodGroup` | `z.enum(['A+','A-','B+','B-','AB+','AB-','O+','O-']).optional()` | Backend enum |
| `heightCm` | `z.number().int().min(50).max(300).optional()` | Backend rule |
| `weightKg` | `z.number().min(1).max(500).optional()` | Backend rule |
| `emergencyContactPhone` | `z.string().regex(/^\+[1-9]\d{6,14}$/).optional()` | E.164 format |
| `symptoms` | `z.string().min(10).max(2000)` | Required for booking |
| `cancellationReason` | `z.string().min(10).max(500)` | Required for cancel |

---

## 10. Loading States

| Screen | Loading Behavior |
|--------|-----------------|
| Doctor Search | Skeleton grid of 6 `DoctorCardSkeleton` components |
| Doctor Profile | Full-page skeleton: header, stats, availability |
| Booking Screen | Slot grid shows spinner until availability loaded |
| Appointment List | Skeleton cards (3 items) |
| Appointment Detail | Full-page skeleton |
| Profile Screen | Card skeleton for each section |

---

## 11. Error States

| Status | Scenario | UI |
|--------|----------|----|
| `400` | Validation on booking (e.g., past date) | Inline field error |
| `403` | Patient account blocked | Full-screen block: "Your account has been suspended." |
| `404` | Doctor not found / not visible | "This doctor's profile is no longer available." |
| `409` | Duplicate booking | Toast: "You already have an active booking with this doctor at this time." |
| `409` | Doctor suspended/rejected | Toast: "This doctor is not currently accepting bookings." |
| `422` | Cancel on invalid status | Toast: "This consultation cannot be cancelled at this stage." |
| Network | Any failed request | Toast with retry button |

---

## 12. Empty States

| Screen | Empty State |
|--------|------------|
| Doctor search (no results) | Illustration + "No doctors found matching your filters." + "Clear Filters" button |
| Upcoming appointments | Illustration + "No upcoming appointments." + "Find a Doctor" CTA |
| Consultation history | Illustration + "No past consultations." |
| Slots unavailable | "No slots available for this day. Try another day." |

---

## 13. Suspended Doctor Handling

If a patient navigates directly to `/patient/doctors/{doctorId}` for a suspended doctor:
- `GET /api/doctors/{doctorId}` returns `404` (backend: `IsPubliclyVisible = false`)
- Frontend shows: "This doctor's profile is not currently available."
- "Book Consultation" CTA is hidden — never shown if doctor is not publicly visible
- Doctor does **not** appear in search results (filtered server-side)

---

## 14. Pagination Behavior

- Default `pageSize = 10`
- Doctor search: infinite scroll or "Load More" button
- Consultation lists: page-based pagination with `PaginationControls`
- URL query params: `?page=2` — enables browser back/forward navigation
- TanStack Query `keepPreviousData = true` to avoid flash during page change

---

## 15. Authorization Rules

- All patient routes guarded by `PatientGuard`
- Doctor or Admin accessing `/patient/*` → redirected to own dashboard
- Unauthenticated access → redirected to `/auth/role`
- Patient can only view **their own** consultations (backend enforces via JWT `sub`)

---

## 16. Responsive Design Notes

- Dashboard: single-column on mobile, 2-col grid on `md+`
- Doctor cards: full-width on mobile, 2-col on `md`, 3-col on `lg`
- Booking screen: bottom-sheet slot picker on mobile, side-panel on desktop
- Filter panel: full-screen drawer on mobile, inline sidebar on `lg+`
- Appointment cards: full-width always; action buttons below content on mobile
- Video room: always full-screen regardless of breakpoint

---

## 17. Future Scalability Notes

- **Doctor reviews**: `POST /api/consultations/{id}/review` — schema-ready; add `RatingStars` + `ReviewTextarea` to `ConsultationDetailScreen` after completion
- **Notifications**: SignalR `notificationHubConnection` — connect on dashboard mount; show badge on bell icon
- **Prescription download**: add "Download Prescription" button to `ConsultationDetailScreen` when `notes` field populated
- **AI symptom assistant**: pre-booking symptom checker using `ai-services` FastAPI — inject above `BookingForm`
- **Follow-up booking**: "Book Follow-up" on completed consultations already wired in `ConsultationHistoryScreen`
