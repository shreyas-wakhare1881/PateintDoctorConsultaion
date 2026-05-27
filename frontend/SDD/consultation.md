# Consultation Module — Frontend SDD

> **Module:** Consultation  
> **Frontend Path:** `src/modules/consultation/`  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-27

---

## Backend Dependency Reference

This frontend module is **strictly dependent on**:

- `backend/Modules/Consultation/SDD/README.md`
- `backend/Modules/Consultation/SDD/Flow.md`
- `backend/Modules/Consultation/SDD/APIs.md`
- `backend/Modules/Consultation/SDD/Database.md`
- `backend/Modules/Doctor/SDD/APIs.md` (slot data, public doctor listing)

Frontend implementation **must remain synchronized** with backend SDD.

---

## 1. Module Purpose

The Consultation module covers the full lifecycle of a medical consultation:

- Booking a new consultation (Patient)
- Doctor response flow: confirm or reject (Doctor)
- Session lifecycle: start → in-progress → complete (Doctor)
- Status-driven UI for all roles (Patient / Doctor / Admin)
- Video consultation room via LiveKit/WebRTC
- Cancellation flow
- Follow-up consultation booking
- Consultation history and detail view

---

## 2. Consultation Status Model

The frontend must render UI **strictly** based on backend-defined statuses. Any unlisted transition must be treated as invalid.

| Status | Who Sees | Actions Available |
|--------|----------|------------------|
| `Pending` | Patient, Doctor | Patient: Cancel · Doctor: Confirm, Reject |
| `Confirmed` | Patient, Doctor | Patient: Cancel, Join (near time) · Doctor: Start, Cancel, No-Show |
| `InProgress` | Patient, Doctor | Patient: Join · Doctor: Complete |
| `Completed` | Patient, Doctor | Patient: Book Follow-up · Read-only otherwise |
| `Rejected` | Patient | Read-only — terminal |
| `Cancelled` | Patient, Doctor | Read-only — terminal |
| `NoShow` | Doctor, Admin | Read-only — terminal |

---

## 3. User Flow

### Patient Booking Flow

```
Doctor Profile (/patient/doctors/[doctorId])
    ↓
Select Slot + Enter Symptoms + Choose Type
    ↓
POST /api/consultations → 201 { status: Pending }
    ↓
Booking Confirm Screen
    ↓
Upcoming Appointments → Appointment Detail
    ↓
[Confirmed] → Join Video Room (on scheduled time)
    ↓
[Completed] → History → Follow-up option
```

### Doctor Management Flow

```
Consultation Requests (/doctor/requests)
    ↓
GET /api/consultations/requests (Pending)
    ↓
Review → Confirm (PUT .../confirm) | Reject (PUT .../reject)
    ↓
[Confirmed] → Schedule (/doctor/schedule)
    ↓
Start (PUT .../start) → InProgress → Join Video Room
    ↓
Complete (PUT .../complete + notes) → Completed
```

---

## 4. Screen Flow

```
[PATIENT SIDE]
BookingScreen
    ↓
BookingConfirmScreen
    ↓
UpcomingAppointmentsScreen
    ↓
AppointmentDetailScreen (Patient)
    ↓
VideoConsultationScreen
    ↓
ConsultationHistoryScreen
    ↓
FollowUpBookingScreen

[DOCTOR SIDE]
ConsultationRequestsScreen
    ↓
RequestDetailScreen
    ↓
ScheduleScreen
    ↓
AppointmentDetailScreen (Doctor)
    ↓
VideoConsultationScreen
```

---

## 5. Route Structure

| Route | Component | Auth | Role | Notes |
|-------|-----------|------|------|-------|
| `/patient/book/[doctorId]` | `BookingScreen` | JWT | Patient | Slot selection + booking form |
| `/patient/appointments` | `UpcomingAppointmentsScreen` | JWT | Patient | Pending + Confirmed |
| `/patient/appointments/[id]` | `AppointmentDetailScreen` | JWT | Patient | Patient-scoped detail |
| `/patient/history` | `ConsultationHistoryScreen` | JWT | Patient | Completed + Cancelled + Rejected |
| `/doctor/requests` | `ConsultationRequestsScreen` | JWT | Doctor | Pending requests |
| `/doctor/requests/[id]` | `RequestDetailScreen` | JWT | Doctor | Full request detail |
| `/doctor/schedule` | `ScheduleScreen` | JWT | Doctor | Confirmed + InProgress |
| `/doctor/appointments/[id]` | `AppointmentDetailScreen` | JWT | Doctor | Doctor-scoped detail |
| `/consultation/video/[roomId]` | `VideoConsultationScreen` | JWT | Patient, Doctor | Video room |

---

## 6. Pages & Components Required

### Pages (Next.js App Router)

| File Path | Description |
|-----------|-------------|
| `src/app/(dashboard)/patient/book/[doctorId]/page.tsx` | Booking form |
| `src/app/(dashboard)/patient/appointments/page.tsx` | Upcoming list |
| `src/app/(dashboard)/patient/appointments/[id]/page.tsx` | Patient appointment detail |
| `src/app/(dashboard)/patient/history/page.tsx` | History list |
| `src/app/(dashboard)/doctor/requests/page.tsx` | Doctor requests list |
| `src/app/(dashboard)/doctor/requests/[id]/page.tsx` | Request detail |
| `src/app/(dashboard)/doctor/schedule/page.tsx` | Doctor schedule |
| `src/app/(dashboard)/doctor/appointments/[id]/page.tsx` | Doctor appointment detail |
| `src/app/consultation/video/[roomId]/page.tsx` | Video room |

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| `BookingForm` | `components/consultation/` | Symptoms, type, follow-up, slot reference |
| `SlotSelector` | `components/consultation/` | Day tabs + time slot grid |
| `BookingConfirmCard` | `components/consultation/` | Pre-submit summary card |
| `BookingSuccessBanner` | `components/consultation/` | Post-booking success state |
| `AppointmentCard` | `components/consultation/` | List card with status badge + actions |
| `AppointmentCardSkeleton` | `components/consultation/` | Loading skeleton |
| `AppointmentStatusBadge` | `components/shared/` | Color-coded status pill |
| `AppointmentDetailHeader` | `components/consultation/` | Doctor/patient summary, date/time, type |
| `SymptomsSection` | `components/consultation/` | Displays patient symptoms |
| `ClinicalNotesSection` | `components/consultation/` | Displays doctor's notes (post-completion) |
| `ConsultationTimeline` | `components/consultation/` | Vertical status history timeline |
| `CancelConsultationModal` | `components/consultation/` | Reason textarea + confirm CTA |
| `RejectConsultationModal` | `components/consultation/` | Doctor reject: reason textarea |
| `CompleteConsultationModal` | `components/consultation/` | Doctor completion: optional notes |
| `NoShowConfirmDialog` | `components/consultation/` | Confirm before marking no-show |
| `JoinConsultationBanner` | `components/consultation/` | "Join Now" CTA, visible within 15 min of start |
| `VideoRoomLayout` | `components/consultation/` | Full-screen video UI wrapper |
| `LocalVideoTile` | `components/consultation/` | Local camera feed (self-view) |
| `RemoteVideoTile` | `components/consultation/` | Remote participant feed |
| `VideoControlBar` | `components/consultation/` | Mute / Camera toggle / End call |
| `VideoReconnectOverlay` | `components/consultation/` | Full-screen overlay during reconnect |
| `VideoWaitingRoom` | `components/consultation/` | Shown while waiting for other party to join |
| `ConsultationNumberBadge` | `components/consultation/` | Human-readable `CONS-YYYYMMDD-XXXX` reference |
| `FollowUpBookingPrompt` | `components/consultation/` | Prompt card on completed consultation |
| `PatientSnapshotCard` | `components/consultation/` | Doctor-view: patient gender, age, blood group |

---

## 7. Screen Definitions

### 7.1 Booking Screen

- Doctor mini-header (non-scrollable): avatar, name, specialization, fee
- `SlotSelector`: day-of-week tabs, time slot grid; grays out booked/unavailable slots
- Consultation type toggle: **Video** | **In-Person**
- Symptoms textarea: required, min 10 chars, max 2000 chars, character counter
- Follow-up toggle: when enabled, shows dropdown to select a past completed consultation with this doctor
- Fee summary footer
- "Confirm Booking" CTA — disabled until all required fields valid
- API: `POST /api/consultations`
- Business rule enforced: doctor must be `Approved + IsPubliclyVisible = true` (checked server-side; `409` returned if violated)

### 7.2 Booking Confirm Screen

- Summary card: doctor name, date, time, type, symptoms preview, fee snapshot
- `ConsultationNumberBadge`: `CONS-20260610-0042`
- Status: "Pending — Awaiting Doctor Confirmation"
- CTA: "View My Appointments" | "Back to Dashboard"
- No API call — displays data from POST response

### 7.3 Upcoming Appointments Screen (Patient)

- Tabs: All | Pending | Confirmed
- `AppointmentCard` per consultation sorted by `scheduledDate` asc
- `JoinConsultationBanner` appears on Confirmed cards within 15 min of start time
- Cancel button on Pending/Confirmed cards
- API: `GET /api/consultations/my?status=Pending,Confirmed`

### 7.4 Appointment Detail Screen (Patient)

- `AppointmentDetailHeader`: doctor info, date/time, type, `AppointmentStatusBadge`
- `ConsultationNumberBadge`
- `SymptomsSection`: submitted symptoms
- `ClinicalNotesSection`: visible only if `notes` field is non-null (post-completion)
- `meetingLink`: visible as "Join Video Consultation" button if `status = Confirmed` or `InProgress`
- `ConsultationTimeline`: status history from `GET /api/consultations/{id}/history`
- Cancel CTA (if `status = Pending` or `Confirmed`) → `CancelConsultationModal`
- Follow-up CTA (if `status = Completed`) → routes to `/patient/book/[doctorId]` pre-filled with `isFollowUp=true`

### 7.5 Consultation History Screen (Patient)

- Tabs: Completed | Cancelled | Rejected | No-Show
- Read-only `AppointmentCard` list
- "Book Follow-up" action on Completed cards
- API: `GET /api/consultations/my?status={tab}&page=`

### 7.6 Consultation Requests Screen (Doctor)

- Pending requests list sorted by `scheduledDate` asc
- `ConsultationRequestCard`: patient name, age, symptoms (truncated), date/time, fee
- Inline "Confirm" (green) / "Reject" (red outline) buttons
- Tap card → `RequestDetailScreen`
- API: `GET /api/consultations/requests`

### 7.7 Request Detail Screen (Doctor)

- `PatientSnapshotCard`: gender, age derived from DOB, blood group
- Full symptoms text
- Date + time + type + fee
- "Confirm Consultation" primary CTA → `PUT /api/consultations/{id}/confirm`
- "Reject" secondary CTA → `RejectConsultationModal` → `PUT /api/consultations/{id}/reject`
- `ConsultationTimeline`

### 7.8 Schedule Screen (Doctor)

- View toggle: **List** (default on mobile) | **Calendar** (default on desktop)
- Tabs: Today | This Week | All Upcoming
- Confirmed + InProgress consultations shown
- "Start Consultation" button on Confirmed items (available from scheduled time)
- "Join" button on InProgress items (when `meetingLink` present)
- API: `GET /api/consultations/schedule`

### 7.9 Appointment Detail Screen (Doctor)

- `AppointmentDetailHeader`: patient name, date/time, type, status badge
- `PatientSnapshotCard`
- `SymptomsSection`
- `AppointmentActionBar` — context-aware:
  - `status = Confirmed` → "Start Consultation" + "Mark No-Show" + "Cancel"
  - `status = InProgress` → "Complete Consultation" (opens `CompleteConsultationModal`) + "Join Video"
  - Terminal states → read-only
- `ConsultationTimeline`
- `ClinicalNotesSection`: editable during InProgress, read-only after Completed

### 7.10 Video Consultation Screen

- Full-screen layout: `RemoteVideoTile` (large) + `LocalVideoTile` (picture-in-picture corner)
- `VideoControlBar` at bottom: Mute mic | Toggle camera | End call
- `VideoWaitingRoom` overlay: "Waiting for the other party to join…"
- `VideoReconnectOverlay`: shown on connection drop with spinner + "Reconnecting…"
- Join room via LiveKit room token derived from `meetingRoomId`
- On "End call" (Doctor): calls `PUT /api/consultations/{id}/complete` via modal
- On "Leave" (Patient): navigates back to appointment detail
- Timer: session duration counter shown in top bar

---

## 8. API Integration Mapping

| Frontend Action | Backend API | Method | Role |
|-----------------|-------------|--------|------|
| Book consultation | `/api/consultations` | POST | Patient |
| Get my consultations | `/api/consultations/my` | GET | Patient |
| Get consultation detail | `/api/consultations/{id}` | GET | All |
| Cancel consultation | `/api/consultations/{id}/cancel` | PUT | Patient, Doctor, Admin |
| Get status history | `/api/consultations/{id}/history` | GET | All |
| Get pending requests | `/api/consultations/requests` | GET | Doctor |
| Confirm consultation | `/api/consultations/{id}/confirm` | PUT | Doctor |
| Reject consultation | `/api/consultations/{id}/reject` | PUT | Doctor |
| Get doctor schedule | `/api/consultations/schedule` | GET | Doctor |
| Start consultation | `/api/consultations/{id}/start` | PUT | Doctor |
| Complete consultation | `/api/consultations/{id}/complete` | PUT | Doctor |

---

## 9. State Management Strategy

**TanStack Query keys:**

| Key | Hook | Stale Time |
|-----|------|-----------|
| `['consultations', 'my', status, page]` | `useMyConsultations` | 30s |
| `['consultation', id]` | `useConsultationDetail` | 30s |
| `['consultation', id, 'history']` | `useConsultationHistory` | 1min |
| `['consultations', 'requests', page]` | `useConsultationRequests` | 30s |
| `['consultations', 'schedule']` | `useDoctorSchedule` | 30s |

**Zustand store** (`bookingStore`):
- `selectedDoctorId`, `selectedSlot`, `selectedDate`, `symptoms`, `consultationType`, `isFollowUp`, `parentConsultationId`
- Cleared after successful booking

**Video room state** (local component state, not persisted):
- `isConnected`, `isReconnecting`, `isMuted`, `isCameraOff`, `sessionDurationSeconds`

---

## 10. Validation Rules

All Zod schemas in `src/modules/consultation/schemas/`.

| Field | Zod Rule | Backend Rule |
|-------|----------|--------------|
| `doctorId` | `z.string().uuid()` | Required, must exist + Approved |
| `scheduledDate` | `z.string().refine(isTodayOrFuture)` | Must not be in past |
| `startTime` | `z.string().regex(/^\d{2}:\d{2}:\d{2}$/)` | HH:mm:ss — combined with date must be future |
| `endTime` | Must be after `startTime` | endTime > startTime |
| `timeZone` | `z.string().min(1)` | Valid IANA timezone |
| `consultationType` | `z.enum(['Video', 'InPerson'])` | Enum validation |
| `symptoms` | `z.string().min(10).max(2000)` | Required, min 10 |
| `cancellationReason` | `z.string().min(10).max(500)` | Required on cancel |
| `rejectReason` | `z.string().min(10).max(500)` | Required on reject |
| `isFollowUp = true` | `parentConsultationId` required | Parent must be Completed + same DoctorId |

---

## 11. Loading States

| Screen | Loading Behavior |
|--------|-----------------|
| Booking screen — slots | Slot grid spinner while loading availability |
| Upcoming appointments | 3 skeleton `AppointmentCard` items |
| Consultation detail | Full-page skeleton with header + timeline |
| Request detail | Skeleton: patient card + symptoms + action bar |
| Schedule screen | Skeleton calendar or list rows |
| Confirm/Reject action | Button spinner, form disabled |
| Video room connecting | `VideoWaitingRoom` overlay with animated spinner |

---

## 12. Error States

| HTTP Status | Scenario | UI |
|-------------|----------|----|
| `400` | Missing/invalid booking fields | Inline field errors via Zod |
| `400` | `reason` too short on cancel/reject | Inline error under textarea |
| `403` | Patient account blocked | Toast: "Your account is blocked. Contact support." |
| `404` | Doctor not found or not visible | "This doctor is not currently available for booking." |
| `409` | Doctor suspended/rejected | Toast: "This doctor is not accepting bookings at this time." |
| `409` | Duplicate booking | Toast: "You already have an active booking with this doctor at this time." |
| `409` | Slot already booked | "This slot is no longer available. Please choose another." + slot refresh |
| `422` | Invalid status for cancel | Toast: "This appointment cannot be cancelled at this stage." |
| `422` | Invalid status for confirm | Toast: "This consultation has already been actioned." |
| Network | Any | Toast with retry button |
| Video — connection lost | — | `VideoReconnectOverlay` with auto-retry (up to 3 attempts) |
| Video — join failed | — | "Unable to join the session. Please refresh and try again." |

---

## 13. Empty States

| Screen | Empty State |
|--------|------------|
| No upcoming appointments | Illustration + "No upcoming appointments." + "Find a Doctor" CTA |
| No consultation history | Illustration + "No past consultations yet." |
| No pending requests (Doctor) | Illustration + "No new consultation requests." |
| No schedule items (Doctor) | Illustration + "No upcoming appointments today." |
| History tab — empty | "No {Cancelled/Completed/Rejected} consultations." |

---

## 14. Join-Room Validations

Before allowing a user to enter the video room, frontend must validate:

| Validation | Rule |
|------------|------|
| Status check | `status` must be `Confirmed` or `InProgress` |
| Meeting link present | `meetingLink` must be non-null |
| Role check | Only Patient or Doctor assigned to this consultation can join |
| Time window | Patient: "Join" button enabled 15 min before scheduled time; Doctor: "Start" button enabled at scheduled time |

If any validation fails: show `AppointmentDetailScreen` with appropriate message — do **not** navigate to video room.

---

## 15. Video Consultation Flow (LiveKit/WebRTC)

```
User taps "Join Now" / "Start Consultation"
    ↓
Frontend requests LiveKit room token
(using meetingRoomId from consultation detail)
    ↓
LiveKit SDK connects to room
    ↓
[Waiting Room] — if other party not yet joined
    ↓
Both parties in room → session begins
    ↓
Doctor taps "End Session"
    ↓
CompleteConsultationModal (optional notes)
    ↓
PUT /api/consultations/{id}/complete
    ↓
Navigate to AppointmentDetailScreen (Completed)
```

**Reconnect handling:**
1. On connection drop: `VideoReconnectOverlay` appears
2. LiveKit SDK auto-attempts reconnect (3 retries, 2s interval)
3. If reconnected: overlay dismissed, session resumes
4. If all retries fail: "Session disconnected. Please rejoin." with "Rejoin" button
5. Rejoining: same `meetingLink` — room stays open until Doctor ends session

**Permissions (browser):**
- Camera and microphone permissions requested on room entry
- If denied: show "Camera/Microphone permission required" error state with instructions

---

## 16. Consultation Timeline Component

The `ConsultationTimeline` renders status transitions sourced from `GET /api/consultations/{id}/history`.

Each history row renders as:
```
[StatusIcon] StatusName — timestamp
             (changedBy role if available)
```

Status icons and colors:
| Status | Color | Icon |
|--------|-------|------|
| `Pending` | Yellow | Clock |
| `Confirmed` | Blue | CheckCircle |
| `InProgress` | Green (animated) | VideoCamera |
| `Completed` | Green | CheckBadge |
| `Cancelled` | Gray | XCircle |
| `Rejected` | Red | Ban |
| `NoShow` | Orange | UserX |

---

## 17. Authorization Rules

- Patient can only view **their own** consultations (`GET /api/consultations/{id}` enforced by backend)
- Doctor can only confirm/reject/start/complete consultations **assigned to them**
- Unauthorized access (wrong owner): backend returns `403` → frontend shows "You don't have access to this consultation."
- Admin can view all consultations — handled in Admin module

---

## 18. Responsive Design Notes

- Booking screen: slot picker as horizontal scroll on mobile, grid on `md+`
- Appointment cards: full-width always; action buttons stacked on mobile
- Video room: always full-screen; control bar pinned to bottom
- Timeline: single column, full-width on all breakpoints
- Modals: bottom sheet on mobile, centered dialog on desktop

---

## 19. Future Scalability Notes

- **AI-generated clinical notes**: after consultation completes, call `ai-services` FastAPI for a notes draft pre-filled in `CompleteConsultationModal`
- **In-room chat**: LiveKit data channel for text chat alongside video
- **Prescription / document upload**: `ClinicalNotesSection` extended to support file attachments
- **Payment integration**: fee capture before booking confirmed → add payment step between `BookingConfirmCard` and final POST
- **Push notifications**: SignalR `notificationHubConnection` → badge on bell icon when new consultation status change received
- **Session recording**: LiveKit recording API — consent screen added to `VideoWaitingRoom`
