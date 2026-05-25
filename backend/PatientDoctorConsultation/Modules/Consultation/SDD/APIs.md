# Consultation Module — API Contract Specification

> **Module:** Consultation  
> **Base Path:** `/api/consultations`  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-24

---

## Quick Reference

| # | Method | Route | Auth | Role | Purpose |
|---|--------|-------|------|------|---------|
| 1 | POST | `/api/consultations` | Bearer JWT | Patient | Book a new consultation |
| 2 | GET | `/api/consultations/my` | Bearer JWT | Patient | Get patient's own consultations |
| 3 | GET | `/api/consultations/{id}` | Bearer JWT | Patient, Doctor, Admin | Get consultation details |
| 4 | PUT | `/api/consultations/{id}/cancel` | Bearer JWT | Patient, Doctor, Admin | Cancel a consultation |
| 5 | GET | `/api/consultations/requests` | Bearer JWT | Doctor | Get pending consultation requests |
| 6 | PUT | `/api/consultations/{id}/confirm` | Bearer JWT | Doctor | Confirm a consultation |
| 7 | PUT | `/api/consultations/{id}/reject` | Bearer JWT | Doctor | Reject a consultation |
| 8 | GET | `/api/consultations/schedule` | Bearer JWT | Doctor | Get doctor's own schedule |
| 9 | PUT | `/api/consultations/{id}/start` | Bearer JWT | Doctor | Mark consultation as InProgress |
| 10 | PUT | `/api/consultations/{id}/complete` | Bearer JWT | Doctor | Mark consultation as Completed |
| 11 | GET | `/api/consultations/{id}/history` | Bearer JWT | Patient, Doctor, Admin | Get status history |
| 12 | GET | `/api/admin/consultations` | Bearer JWT | Admin | Get all consultations (paginated) |

---

## Standard Response Envelope

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

## Patient APIs

---

### 1. Book Consultation

**`POST /api/consultations`**

> Submits a new consultation booking request. Creates a `Consultations` row with `Status = Pending`. Requires the target doctor to be `Approved` and `IsPubliclyVisible = true`.

#### Authorization
Bearer JWT — Role: `Patient`

#### Request Body
```json
{
  "doctorId": "uuid",
  "availabilityId": "uuid (optional)",
  "scheduledDate": "2026-06-10",
  "startTime": "10:00:00",
  "endTime": "10:30:00",
  "timeZone": "Asia/Kolkata",
  "consultationType": "Video",
  "symptoms": "Persistent chest pain for 3 days, mild shortness of breath",
  "isFollowUp": false,
  "parentConsultationId": null
}
```

#### Validation Rules
| Field | Rule |
|-------|------|
| `doctorId` | Required · Must exist · Doctor must be `Approved` + `IsPubliclyVisible = true` |
| `scheduledDate` | Required · Must be today or a future date |
| `startTime` | Required · Combined with `scheduledDate` must be in the future |
| `endTime` | Required · Must be after `startTime` |
| `timeZone` | Required · Must be a valid IANA timezone string |
| `consultationType` | Required · Enum: `Video` or `InPerson` |
| `symptoms` | Required · Min 10 chars · Max 2000 chars |
| `availabilityId` | Optional · If provided, must reference an available (non-booked) slot |
| `parentConsultationId` | Required if `isFollowUp = true` · Referenced consultation must have `Status = Completed` and same `DoctorId` |

#### Business Rules
- **Doctor eligibility guard** *(admin moderation enforcement)*: The target doctor must satisfy ALL three conditions at the moment of booking:
  - `ApprovalStatus == Approved` — pending, rejected, or suspended doctors cannot receive bookings
  - `IsPubliclyVisible == true` — hidden/suspended doctors are blocked from new bookings
  - `DeletedAt == null` — soft-deleted doctor profiles are fully excluded
  - A suspended doctor fails all three conditions; attempting to book with one returns `409 Conflict` (invalid business state).
- **Patient account guard**: If admin has blocked the patient (`Users.IsActive = false`) after a valid JWT was issued, the booking is rejected with `403 Forbidden`. This prevents stale-JWT exploitation between block action and token expiry.
- Duplicate booking check: patient cannot have two `Pending` or `Confirmed` consultations with the same doctor at the same date/time
- `ConsultationNumber` is system-generated (e.g., `CONS-20260610-0042`)
- A `ConsultationStatusHistory` row is inserted: `OldStatus = NULL`, `NewStatus = Pending`

#### Success Response — `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "consultationNumber": "CONS-20260610-0042",
    "status": "Pending",
    "consultationType": "Video",
    "scheduledDate": "2026-06-10",
    "startTime": "10:00:00",
    "endTime": "10:30:00",
    "timeZone": "Asia/Kolkata",
    "consultationFeeSnapshot": 800.00,
    "doctorId": "uuid",
    "createdAt": "2026-05-24T08:00:00Z"
  },
  "message": "Consultation booked. Awaiting doctor confirmation."
}
```

#### Error Responses
| Status | Scenario |
|--------|----------|
| `400` | Validation failed (missing fields, past date, invalid enum) |
| `403` | Patient account is blocked by admin — booking denied with stale JWT |
| `404` | Doctor not found |
| `409` | Doctor is suspended, rejected, hidden, or not approved — business state conflicts with booking |
| `409` | Duplicate booking detected |
| `409` | Slot already booked |

---

### 2. Get My Consultations

**`GET /api/consultations/my`**

> Returns all consultations for the authenticated patient. Supports filtering by status. Excludes soft-deleted records.

#### Authorization
Bearer JWT — Role: `Patient`

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string (optional) | Filter by `ConsultationStatus` enum value |
| `page` | integer (optional) | Page number (default: 1) |
| `pageSize` | integer (optional) | Records per page (default: 10, max: 50) |

#### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "consultationNumber": "CONS-20260610-0042",
        "status": "Confirmed",
        "consultationType": "Video",
        "scheduledDate": "2026-06-10",
        "startTime": "10:00:00",
        "doctor": {
          "id": "uuid",
          "fullName": "Dr. Arjun Mehta",
          "specialization": "Cardiologist",
          "profileImageUrl": "https://cdn.example.com/profiles/uuid.jpg"
        },
        "consultationFeeSnapshot": 800.00,
        "createdAt": "2026-05-24T08:00:00Z"
      }
    ],
    "totalCount": 12,
    "page": 1,
    "pageSize": 10
  }
}
```

---

### 3. Get Consultation Details

**`GET /api/consultations/{id}`**

> Returns full details of a consultation. A patient can only access their own consultations. A doctor can only access consultations assigned to them. Admin can access any.

#### Authorization
Bearer JWT — Role: `Patient`, `Doctor`, or `Admin`

#### Path Parameters
| Parameter | Description |
|-----------|-------------|
| `id` | Consultation UUID |

#### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "consultationNumber": "CONS-20260610-0042",
    "status": "Confirmed",
    "consultationType": "Video",
    "scheduledDate": "2026-06-10",
    "startTime": "10:00:00",
    "endTime": "10:30:00",
    "timeZone": "Asia/Kolkata",
    "symptoms": "Persistent chest pain for 3 days",
    "notes": null,
    "cancellationReason": null,
    "cancelledBy": null,
    "meetingLink": "https://meet.example.com/rooms/abc123",
    "consultationFeeSnapshot": 800.00,
    "isFollowUp": false,
    "parentConsultationId": null,
    "patient": { "id": "uuid", "fullName": "Rahul Sharma" },
    "doctor": { "id": "uuid", "fullName": "Dr. Arjun Mehta", "specialization": "Cardiologist" },
    "createdAt": "2026-05-24T08:00:00Z",
    "updatedAt": "2026-05-24T09:00:00Z"
  }
}
```

#### Error Responses
| Status | Scenario |
|--------|----------|
| `403` | Patient/Doctor requesting a consultation they don't own |
| `404` | Consultation not found or soft-deleted |

---

### 4. Cancel Consultation

**`PUT /api/consultations/{id}/cancel`**

> Cancels an active consultation. Allowed from `Pending` or `Confirmed` states only. `InProgress`, `Completed`, `Rejected`, and `NoShow` consultations cannot be cancelled.

#### Authorization
Bearer JWT — Role: `Patient`, `Doctor`, or `Admin`

#### Request Body
```json
{
  "reason": "Patient has a scheduling conflict and cannot attend."
}
```

#### Validation Rules
| Field | Rule |
|-------|------|
| `reason` | Required · Min 10 chars · Max 500 chars |
| Current `Status` | Must be `Pending` or `Confirmed` |

#### Business Rules
- `CancelledBy` is derived from the authenticated user's role (Patient / Doctor / Admin)
- `CancellationReason` and `CancelledBy` are set and thereafter immutable
- A `ConsultationStatusHistory` row is inserted: `{OldStatus} → Cancelled`

#### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "Cancelled",
    "cancelledBy": "Patient",
    "cancellationReason": "Patient has a scheduling conflict and cannot attend.",
    "updatedAt": "2026-05-24T10:00:00Z"
  },
  "message": "Consultation cancelled successfully."
}
```

#### Error Responses
| Status | Scenario |
|--------|----------|
| `400` | `reason` is missing or too short |
| `403` | Patient attempting to cancel another patient's consultation |
| `404` | Consultation not found |
| `422` | Status is not `Pending` or `Confirmed` — cancellation not permitted |

---

## Doctor APIs

---

### 5. Get Consultation Requests

**`GET /api/consultations/requests`**

> Returns all `Pending` consultations assigned to the authenticated doctor, ordered by scheduled date ascending.

#### Authorization
Bearer JWT — Role: `Doctor`

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer (optional) | Page number (default: 1) |
| `pageSize` | integer (optional) | Records per page (default: 10, max: 50) |

#### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "consultationNumber": "CONS-20260610-0042",
        "status": "Pending",
        "consultationType": "Video",
        "scheduledDate": "2026-06-10",
        "startTime": "10:00:00",
        "symptoms": "Persistent chest pain for 3 days",
        "patient": {
          "id": "uuid",
          "fullName": "Rahul Sharma",
          "gender": "Male",
          "dateOfBirth": "1990-03-15"
        },
        "consultationFeeSnapshot": 800.00
      }
    ],
    "totalCount": 3,
    "page": 1,
    "pageSize": 10
  }
}
```

---

### 6. Confirm Consultation

**`PUT /api/consultations/{id}/confirm`**

> Doctor confirms an incoming booking. Status transitions `Pending → Confirmed`. For `Video` type, meeting room details are generated.

#### Authorization
Bearer JWT — Role: `Doctor`

#### Request Body
None required.

#### Business Rules
- Consultation must be `Status = Pending`
- Consultation must be assigned to the authenticated doctor (`DoctorId` match)
- If `ConsultationType = Video`: `MeetingRoomId` and `MeetingLink` are generated and persisted
- A `ConsultationStatusHistory` row is inserted: `Pending → Confirmed`

#### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "Confirmed",
    "meetingLink": "https://meet.example.com/rooms/abc123",
    "meetingRoomId": "abc123",
    "updatedAt": "2026-05-24T09:00:00Z"
  },
  "message": "Consultation confirmed."
}
```

#### Error Responses
| Status | Scenario |
|--------|----------|
| `403` | Doctor does not own this consultation |
| `404` | Consultation not found |
| `422` | Status is not `Pending` |

---

### 7. Reject Consultation

**`PUT /api/consultations/{id}/reject`**

> Doctor declines a pending booking with a reason. Status transitions `Pending → Rejected`. Terminal state — no further transitions allowed.

#### Authorization
Bearer JWT — Role: `Doctor`

#### Request Body
```json
{
  "reason": "Slot is no longer available due to an emergency."
}
```

#### Validation Rules
| Field | Rule |
|-------|------|
| `reason` | Required · Min 10 chars · Max 500 chars |
| Current `Status` | Must be `Pending` |

#### Business Rules
- A `ConsultationStatusHistory` row is inserted: `Pending → Rejected`, reason stored
- `Rejected` is a terminal state

#### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "Rejected",
    "updatedAt": "2026-05-24T09:30:00Z"
  },
  "message": "Consultation rejected."
}
```

---

### 8. Get Doctor Schedule

**`GET /api/consultations/schedule`**

> Returns all `Confirmed` and `InProgress` consultations for the authenticated doctor, grouped or filtered by date.

#### Authorization
Bearer JWT — Role: `Doctor`

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | date (optional) | Filter by specific scheduled date (`YYYY-MM-DD`) |
| `page` | integer (optional) | Page number (default: 1) |
| `pageSize` | integer (optional) | Records per page (default: 20, max: 50) |

#### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "consultationNumber": "CONS-20260610-0042",
        "status": "Confirmed",
        "scheduledDate": "2026-06-10",
        "startTime": "10:00:00",
        "endTime": "10:30:00",
        "consultationType": "Video",
        "patient": { "id": "uuid", "fullName": "Rahul Sharma" },
        "meetingLink": "https://meet.example.com/rooms/abc123"
      }
    ],
    "totalCount": 8,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 9. Mark Consultation InProgress

**`PUT /api/consultations/{id}/start`**

> Doctor starts the session. Status transitions `Confirmed → InProgress`. For Video type, `MeetingStartedAt` is stamped.

#### Authorization
Bearer JWT — Role: `Doctor`

#### Request Body
None required.

#### Business Rules
- Consultation must be `Status = Confirmed`
- Consultation must be assigned to the authenticated doctor
- For `ConsultationType = Video`: `MeetingStartedAt` is set to current UTC time
- A `ConsultationStatusHistory` row is inserted: `Confirmed → InProgress`

#### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "InProgress",
    "meetingStartedAt": "2026-06-10T04:32:00Z",
    "updatedAt": "2026-06-10T04:32:00Z"
  },
  "message": "Consultation started."
}
```

#### Error Responses
| Status | Scenario |
|--------|----------|
| `403` | Doctor does not own this consultation |
| `404` | Consultation not found |
| `422` | Status is not `Confirmed` |

---

### 10. Mark Consultation Completed

**`PUT /api/consultations/{id}/complete`**

> Doctor concludes the consultation. Status transitions `InProgress → Completed`. Doctor may add clinical notes. For Video type, `MeetingEndedAt` is stamped.

#### Authorization
Bearer JWT — Role: `Doctor`

#### Request Body
```json
{
  "notes": "Patient presented with atypical chest pain. ECG normal. Advised stress test. Prescribed pantoprazole 40mg OD for 2 weeks."
}
```

#### Validation Rules
| Field | Rule |
|-------|------|
| `notes` | Optional · Max 5000 chars |
| Current `Status` | Must be `InProgress` |

#### Business Rules
- `Notes` is optional at MVP but persisted if provided
- For `ConsultationType = Video`: `MeetingEndedAt` is stamped with current UTC time
- A `ConsultationStatusHistory` row is inserted: `InProgress → Completed`
- `Doctors.TotalConsultations` is incremented (Doctor Module responsibility — cross-module call at service layer)

#### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "Completed",
    "notes": "Patient presented with atypical chest pain...",
    "meetingEndedAt": "2026-06-10T04:58:00Z",
    "updatedAt": "2026-06-10T04:58:00Z"
  },
  "message": "Consultation completed."
}
```

#### Error Responses
| Status | Scenario |
|--------|----------|
| `403` | Doctor does not own this consultation |
| `404` | Consultation not found |
| `422` | Status is not `InProgress` |

---

## Shared APIs

---

### 11. Get Consultation Status History

**`GET /api/consultations/{id}/history`**

> Returns the full chronological status history for a consultation. Each entry captures the old status, new status, who made the change, and the reason.

#### Authorization
Bearer JWT — Role: `Patient` (own consultations), `Doctor` (own consultations), `Admin`

#### Success Response — `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "consultationId": "uuid",
      "oldStatus": null,
      "newStatus": "Pending",
      "changedByUserId": "uuid",
      "changedByName": "Rahul Sharma",
      "reason": null,
      "createdAt": "2026-05-24T08:00:00Z"
    },
    {
      "id": "uuid",
      "consultationId": "uuid",
      "oldStatus": "Pending",
      "newStatus": "Confirmed",
      "changedByUserId": "uuid",
      "changedByName": "Dr. Arjun Mehta",
      "reason": null,
      "createdAt": "2026-05-24T09:00:00Z"
    }
  ]
}
```

#### Error Responses
| Status | Scenario |
|--------|----------|
| `403` | Requesting user does not have access to this consultation |
| `404` | Consultation not found |

---

## Admin APIs

---

### 12. Get All Consultations

**`GET /api/admin/consultations`**

> Paginated list of all consultations across the platform. Supports filtering by status, date range, doctor, and patient. Admin-only access.

#### Authorization
Bearer JWT — Role: `Admin`

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string (optional) | Filter by `ConsultationStatus` enum |
| `doctorId` | uuid (optional) | Filter by doctor |
| `patientId` | uuid (optional) | Filter by patient |
| `dateFrom` | date (optional) | Filter from scheduled date |
| `dateTo` | date (optional) | Filter to scheduled date |
| `consultationType` | string (optional) | `Video` or `InPerson` |
| `page` | integer (optional) | Default: 1 |
| `pageSize` | integer (optional) | Default: 20, max: 100 |

#### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "consultationNumber": "CONS-20260610-0042",
        "status": "Completed",
        "consultationType": "Video",
        "scheduledDate": "2026-06-10",
        "patient": { "id": "uuid", "fullName": "Rahul Sharma" },
        "doctor": { "id": "uuid", "fullName": "Dr. Arjun Mehta", "specialization": "Cardiologist" },
        "consultationFeeSnapshot": 800.00,
        "createdAt": "2026-05-24T08:00:00Z"
      }
    ],
    "totalCount": 1250,
    "page": 1,
    "pageSize": 20
  }
}
```

