# Admin Module — Frontend SDD

> **Module:** Admin  
> **Frontend Path:** `src/modules/admin/`  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-27

---

## Backend Dependency Reference

This frontend module is **strictly dependent on**:

- `backend/Modules/Admin/SDD/README.md`
- `backend/Modules/Admin/SDD/Flow.md`
- `backend/Modules/Admin/SDD/APIs.md`
- `backend/Modules/Admin/SDD/Database.md`
- `backend/Modules/Auth/SDD/APIs.md` (shared login endpoint)

Frontend implementation **must remain synchronized** with backend SDD.

---

## 1. Module Purpose

The Admin module is the **governance and moderation** interface of the platform. Admins are seeded at startup — no self-registration. This module covers:

- Admin login
- Platform statistics dashboard
- Doctor moderation (approve / reject / suspend / reactivate)
- Patient moderation (block / unblock)
- Consultation monitoring (read-only)
- Audit log review

---

## 2. User Flow

```
Admin Login (/auth/login?role=admin)
    │
    ▼
POST /api/auth/login { email, password, role: "Admin" }
    │
    ▼
Admin Dashboard (/admin/dashboard)
    │
    ├── GET /api/admin/dashboard → Stats Cards
    │
    ├── Doctors → Pending Queue (/admin/doctors/pending)
    │       ↓
    │   Doctor Detail → Approve / Reject
    │
    ├── All Doctors (/admin/doctors)
    │       ↓
    │   Filter by status → Suspend / Reactivate
    │
    ├── Patients (/admin/patients)
    │       ↓
    │   Search → Block / Unblock
    │
    ├── Consultations (/admin/consultations)
    │       ↓
    │   Filters → Consultation Detail (read-only)
    │
    └── Audit Logs (/admin/audit-logs)
            ↓
        Filter by action type / date
```

---

## 3. Screen Flow

```
AdminLoginScreen
    ↓
AdminDashboard
    ├── PendingDoctorsScreen
    │       ↓
    │   DoctorModerationDetailScreen (Approve / Reject)
    │
    ├── AllDoctorsScreen
    │       ↓
    │   DoctorModerationDetailScreen (Suspend / Reactivate)
    │
    ├── PatientsScreen
    │       ↓
    │   PatientDetailScreen (Block / Unblock)
    │
    ├── ConsultationMonitoringScreen
    │       ↓
    │   ConsultationDetailScreen (read-only)
    │
    └── AuditLogsScreen
```

---

## 4. Route Structure

| Route | Component | Auth | Role |
|-------|-----------|------|------|
| `/auth/login?role=admin` | `CredentialLoginScreen` | No | — |
| `/admin/dashboard` | `AdminDashboard` | JWT | Admin |
| `/admin/doctors/pending` | `PendingDoctorsScreen` | JWT | Admin |
| `/admin/doctors` | `AllDoctorsScreen` | JWT | Admin |
| `/admin/doctors/[doctorId]` | `DoctorModerationDetailScreen` | JWT | Admin |
| `/admin/patients` | `PatientsScreen` | JWT | Admin |
| `/admin/patients/[userId]` | `PatientDetailScreen` | JWT | Admin |
| `/admin/consultations` | `ConsultationMonitoringScreen` | JWT | Admin |
| `/admin/consultations/[id]` | `AdminConsultationDetailScreen` | JWT | Admin |
| `/admin/audit-logs` | `AuditLogsScreen` | JWT | Admin |

---

## 5. Pages & Components Required

### Pages (Next.js App Router)

| File Path | Description |
|-----------|-------------|
| `src/app/(dashboard)/admin/dashboard/page.tsx` | Admin home with stats |
| `src/app/(dashboard)/admin/doctors/pending/page.tsx` | Pending doctor queue |
| `src/app/(dashboard)/admin/doctors/page.tsx` | All doctors with filters |
| `src/app/(dashboard)/admin/doctors/[doctorId]/page.tsx` | Doctor moderation detail |
| `src/app/(dashboard)/admin/patients/page.tsx` | Patient list |
| `src/app/(dashboard)/admin/patients/[userId]/page.tsx` | Patient detail + actions |
| `src/app/(dashboard)/admin/consultations/page.tsx` | Consultation monitor |
| `src/app/(dashboard)/admin/consultations/[id]/page.tsx` | Consultation detail (read-only) |
| `src/app/(dashboard)/admin/audit-logs/page.tsx` | Audit log viewer |

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| `AdminSidebar` | `components/admin/` | Left nav: Dashboard, Doctors, Patients, Consultations, Audit Logs |
| `AdminTopBar` | `components/admin/` | Page title, admin name, logout button |
| `StatCard` | `components/admin/` | Single stat tile: label + value + optional change indicator |
| `StatCardSkeleton` | `components/admin/` | Loading skeleton for `StatCard` |
| `PendingDoctorCard` | `components/admin/` | Name, specialization, license, city, submitted date |
| `PendingDoctorCardSkeleton` | `components/admin/` | Skeleton |
| `DoctorStatusBadge` | `components/admin/` | Color-coded: Pending / Approved / Rejected / Suspended |
| `DoctorModerationPanel` | `components/admin/` | Right panel: professional details, actions |
| `ApproveDoctorDialog` | `components/admin/` | Confirmation dialog with optional reason field |
| `RejectDoctorDialog` | `components/admin/` | Confirmation dialog with required reason field |
| `SuspendDoctorDialog` | `components/admin/` | Required reason field + confirm |
| `ReactivateDoctorDialog` | `components/admin/` | Optional reason field + confirm |
| `DoctorFilterBar` | `components/admin/` | Filter chips: status, city, search input |
| `DoctorTableRow` | `components/admin/` | Table row: name, status, city, joined, action button |
| `PatientTableRow` | `components/admin/` | Table row: name, phone, active status, joined, action button |
| `PatientFilterBar` | `components/admin/` | Filter: isActive toggle, search input |
| `BlockPatientDialog` | `components/admin/` | Required reason field + confirm |
| `UnblockPatientDialog` | `components/admin/` | Optional reason + confirm |
| `PatientStatusBadge` | `components/admin/` | Active (green) / Blocked (red) |
| `ConsultationTableRow` | `components/admin/` | Patient, doctor, status, scheduled at |
| `ConsultationFilterBar` | `components/admin/` | Status, doctorId, patientId, date range |
| `AdminConsultationTimeline` | `components/admin/` | Read-only status history timeline |
| `AuditLogRow` | `components/admin/` | Admin name, action type, target, reason, timestamp |
| `AuditLogFilterBar` | `components/admin/` | Action type, entity type, date range |
| `ConfirmationDialog` | `components/shared/` | Generic confirm/cancel with reason textarea slot |
| `PaginationControls` | `components/shared/` | Page navigation |
| `DataTable` | `components/shared/` | Generic sortable table wrapper |

---

## 6. Screen Definitions

### 6.1 Admin Login Screen

- Shared `CredentialLoginScreen` with `role = "Admin"` in request body
- "Admin Portal" label distinguishes from Doctor login
- No OTP — email + password only
- On success: redirect `/admin/dashboard`
- Error `401` → `AuthErrorBanner`: "Invalid email or password."
- Error `403` (IsActive=false) → "Admin account is disabled."

### 6.2 Admin Dashboard

- Stats row (6 cards): 
  - Total Doctors | Pending Doctors | Suspended Doctors
  - Total Active Patients | Total Consultations | Today's Consultations
- API: `GET /api/admin/dashboard`
- "Pending Doctors" card is clickable → navigates to `/admin/doctors/pending`
- Quick links: "Review Pending Doctors" (if `pendingDoctors > 0` — badge with count)
- Recent activity section (optional): last 5 audit log entries

### 6.3 Pending Doctors Screen

- Header: "Pending Approval ({count})"
- `PendingDoctorCard` list sorted by `createdAt` asc (oldest first — FIFO queue)
- Tap card → `DoctorModerationDetailScreen`
- Empty state: "No doctors pending approval."
- API: `GET /api/admin/doctors/pending`
- Pagination: `pageSize = 20`

### 6.4 All Doctors Screen

- `DoctorFilterBar`: status dropdown (All / Pending / Approved / Rejected / Suspended), city input, search by name or license
- `DataTable` with `DoctorTableRow` items
- Columns: Name | Specialization | Status | City | Joined | Action
- "View" button on each row → `DoctorModerationDetailScreen`
- API: `GET /api/admin/doctors?approvalStatus=&city=&search=&page=`

### 6.5 Doctor Moderation Detail Screen

- Doctor profile display: name, email, specialization, qualification, experience, license, city, bio, languages
- `DoctorStatusBadge` at top
- **Action Panel** — context-aware by `approvalStatus`:
  - `Pending` → "Approve" (green) + "Reject" (red)
  - `Approved` → "Suspend" (orange)
  - `Suspended` → "Reactivate" (green)
  - `Rejected` → "Approve" (green, to re-approve after edits)
  - Terminal `Approved` with `isPubliclyVisible = true` → shows "Visible to Patients" badge
- Each action opens its respective confirmation dialog (all require reason for destructive actions)
- API for actions:
  - `PATCH /api/admin/doctors/{doctorId}/approve`
  - `PATCH /api/admin/doctors/{doctorId}/reject`
  - `PATCH /api/admin/doctors/{doctorId}/suspend`
  - `PATCH /api/admin/doctors/{doctorId}/reactivate`
- After action: redirect back to All Doctors list, invalidate TanStack Query cache

### 6.6 Patients Screen

- `PatientFilterBar`: search (name or phone), isActive filter toggle (All / Active / Blocked)
- `DataTable` with `PatientTableRow`
- Columns: Name | Phone | Status | Verified | Joined | Action
- "View" button → `PatientDetailScreen`
- API: `GET /api/admin/patients?isActive=&search=&page=`

### 6.7 Patient Detail Screen

- Patient info: name, phone, isActive, isVerified, joined date
- Healthcare profile summary (if available): blood group, city
- **Action Panel**:
  - `isActive = true` → "Block Patient" button (red)
  - `isActive = false` → "Unblock Patient" button (green)
- `BlockPatientDialog`: required reason — API: `PATCH /api/admin/patients/{userId}/block`
- `UnblockPatientDialog`: optional reason — API: `PATCH /api/admin/patients/{userId}/unblock`
- Recent consultations list (linked to consultation monitor)

### 6.8 Consultation Monitoring Screen

- `ConsultationFilterBar`: status, doctorId, patientId, dateFrom, dateTo
- `DataTable` with `ConsultationTableRow`
- Columns: Consultation # | Patient | Doctor | Status | Scheduled | Completed
- "View" → `AdminConsultationDetailScreen`
- Read-only — no moderation actions
- API: `GET /api/admin/consultations`

### 6.9 Admin Consultation Detail Screen

- Full consultation detail: patient info, doctor info, symptoms, notes, status, type
- `AdminConsultationTimeline`: status history read-only
- Cancel button visible if `status = Pending` or `Confirmed` — `PUT /api/consultations/{id}/cancel`
- API: `GET /api/admin/consultations/{consultationId}`

### 6.10 Audit Logs Screen

- `AuditLogFilterBar`: actionType, targetEntityType, dateFrom, dateTo
- `DataTable` / chronological list of `AuditLogRow`
- Columns: Admin | Action | Target Type | Target Name | Reason | Timestamp
- Read-only — no actions
- API: `GET /api/admin/audit-logs`
- Default sort: `createdAt` descending (newest first)

---

## 7. API Integration Mapping

| Frontend Action | Backend API | Method |
|-----------------|-------------|--------|
| Admin login | `/api/auth/login` | POST |
| Dashboard stats | `/api/admin/dashboard` | GET |
| Pending doctors | `/api/admin/doctors/pending` | GET |
| All doctors | `/api/admin/doctors` | GET |
| Approve doctor | `/api/admin/doctors/{doctorId}/approve` | PATCH |
| Reject doctor | `/api/admin/doctors/{doctorId}/reject` | PATCH |
| Suspend doctor | `/api/admin/doctors/{doctorId}/suspend` | PATCH |
| Reactivate doctor | `/api/admin/doctors/{doctorId}/reactivate` | PATCH |
| List patients | `/api/admin/patients` | GET |
| Block patient | `/api/admin/patients/{userId}/block` | PATCH |
| Unblock patient | `/api/admin/patients/{userId}/unblock` | PATCH |
| List consultations | `/api/admin/consultations` | GET |
| Consultation detail | `/api/admin/consultations/{consultationId}` | GET |
| Cancel consultation | `/api/consultations/{id}/cancel` | PUT |
| Audit logs | `/api/admin/audit-logs` | GET |

---

## 8. State Management Strategy

**TanStack Query keys:**

| Key | Hook | Stale Time |
|-----|------|-----------|
| `['admin', 'dashboard']` | `useAdminDashboard` | 1min |
| `['admin', 'doctors', 'pending', page]` | `usePendingDoctors` | 30s |
| `['admin', 'doctors', filters, page]` | `useAllDoctors` | 30s |
| `['admin', 'doctor', doctorId]` | `useAdminDoctorDetail` | 30s |
| `['admin', 'patients', filters, page]` | `useAdminPatients` | 30s |
| `['admin', 'consultations', filters, page]` | `useAdminConsultations` | 30s |
| `['admin', 'audit-logs', filters, page]` | `useAuditLogs` | 1min |

**After any moderation action**: invalidate related query keys immediately to show updated state.  
**Optimistic updates**: not used for admin moderation — always wait for server confirmation before updating UI.

---

## 9. Confirmation Dialogs

All destructive or significant admin actions **must use a confirmation dialog** before API call.

| Action | Dialog Type | Reason Required |
|--------|-------------|-----------------|
| Approve doctor | `ApproveDoctorDialog` | Optional |
| Reject doctor | `RejectDoctorDialog` | **Required** (min 10 chars) |
| Suspend doctor | `SuspendDoctorDialog` | **Required** (min 10 chars) |
| Reactivate doctor | `ReactivateDoctorDialog` | Optional |
| Block patient | `BlockPatientDialog` | **Required** (min 10 chars) |
| Unblock patient | `UnblockPatientDialog` | Optional |

Dialog structure:
- Title: "Confirm {Action}"
- Body: "Are you sure you want to {action} {name}? This action cannot be easily undone."
- Reason textarea (if required)
- Buttons: "Confirm" (destructive color) + "Cancel"
- Loading state on "Confirm" button while API call in flight

---

## 10. Validation Rules

| Field | Zod Rule | Backend Rule |
|-------|----------|--------------|
| `reason` (reject/suspend/block) | `z.string().min(10).max(500)` | Required, max 500 |
| `reason` (approve/reactivate/unblock) | `z.string().max(500).optional()` | Optional |
| `email` (admin login) | `z.string().email()` | Required |
| `password` (admin login) | `z.string().min(6)` | Required |

---

## 11. Loading States

| Screen | Loading Behavior |
|--------|-----------------|
| Dashboard | 6 `StatCardSkeleton` tiles |
| Pending doctors | 5 `PendingDoctorCardSkeleton` cards |
| All doctors table | Table rows replaced with skeleton rows |
| Patients table | Skeleton rows |
| Consultation table | Skeleton rows |
| Audit logs | Skeleton rows |
| Dialog confirm button | Spinner while PATCH in flight |

---

## 12. Error States

| Status | Scenario | UI |
|--------|----------|----|
| `401` | Admin login invalid credentials | `AuthErrorBanner`: "Invalid email or password." |
| `403` | Non-admin JWT accessing `/admin/*` | Redirect to own dashboard |
| `403` | Admin account disabled | "Admin account is disabled. Contact system administrator." |
| `404` | Doctor not found for moderation | Toast: "Doctor not found." + redirect to list |
| `409` | Doctor already in target status | Toast: "Doctor is already {status}." |
| `409` | Patient already blocked | Toast: "Patient is already blocked." |
| `422` | Missing required reason | Inline error in dialog textarea |
| Network | Any | Toast with retry |

---

## 13. Empty States

| Screen | Empty State |
|--------|------------|
| Pending doctors — none | Illustration + "No pending doctor approvals. You're all caught up!" |
| All doctors — no results | "No doctors match your filters." + "Clear Filters" |
| Patients — no results | "No patients match your search." |
| Consultations — no results | "No consultations found for the selected filters." |
| Audit logs — none | "No audit log entries found." |

---

## 14. Authorization Rules

- All `/admin/*` routes wrapped in `AdminGuard`
- `AdminGuard` checks `role = Admin` in Zustand auth store
- Any non-Admin JWT accessing admin routes → redirect to own role's dashboard
- Unauthenticated → redirect to `/auth/role`
- Admin accounts are **seeded only** — no registration UI exists

---

## 15. Role Protection Rules

| Guard | Behavior |
|-------|----------|
| `AdminGuard` | Only `role = Admin` allowed; all others redirected |
| JWT expiry | Refresh token flow applies (same as other roles) |
| Logout | Clears tokens, redirects to `/auth/role` |

---

## 16. Responsive Design Notes

- Admin layout: **sidebar + main content** on `lg+`; sidebar collapses to hamburger menu on mobile
- `AdminSidebar`: fixed left `w-64` on desktop; slide-over drawer on mobile
- `DataTable`: horizontal scroll on mobile; full columns on `lg+`
- `StatCard` grid: 1-col on mobile, 2-col on `md`, 3-col on `lg`
- Dialogs: bottom sheet on mobile, centered modal on desktop
- `PendingDoctorCard` list: single column on mobile, 2-col on `lg`

---

## 17. Future Scalability Notes

- **Multi-admin support**: `auditLogs.adminUserId` filter already supported; filter bar can expose "Filter by Admin"
- **Role-based admin permissions**: future sub-roles (SuperAdmin vs. Moderator) — add `adminRole` claim to JWT
- **Real-time moderation queue**: SignalR notification when new doctor registers → live badge count update on sidebar
- **Bulk actions**: "Approve All Verified" batch action for pending queue
- **Dashboard charts**: trend graphs for consultations over time using Recharts / Victory — `GET /api/admin/dashboard` extensible
- **Export**: "Download CSV" for doctor/patient/consultation tables
