# Admin Module — API Contract Specification

> **Module:** Admin  
> **Base Path:** `/api/admin`  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-25

---

## Quick Reference

| # | Method | Route | Auth Required | Purpose |
|---|--------|-------|---------------|---------|
| 1 | POST | `/api/auth/login` | None | Admin email+password login (shared Auth endpoint) |
| 2 | GET | `/api/admin/dashboard` | Bearer JWT (Admin) | Platform operational statistics |
| 3 | GET | `/api/admin/doctors/pending` | Bearer JWT (Admin) | List doctors awaiting approval |
| 4 | GET | `/api/admin/doctors` | Bearer JWT (Admin) | List all doctors with filters |
| 5 | PATCH | `/api/admin/doctors/{doctorId}/approve` | Bearer JWT (Admin) | Approve a pending doctor |
| 6 | PATCH | `/api/admin/doctors/{doctorId}/reject` | Bearer JWT (Admin) | Reject a pending doctor |
| 7 | PATCH | `/api/admin/doctors/{doctorId}/suspend` | Bearer JWT (Admin) | Suspend an approved doctor |
| 8 | PATCH | `/api/admin/doctors/{doctorId}/reactivate` | Bearer JWT (Admin) | Reactivate a suspended doctor |
| 9 | GET | `/api/admin/patients` | Bearer JWT (Admin) | List all patients with filters |
| 10 | PATCH | `/api/admin/patients/{userId}/block` | Bearer JWT (Admin) | Block a patient account |
| 11 | PATCH | `/api/admin/patients/{userId}/unblock` | Bearer JWT (Admin) | Unblock a patient account |
| 12 | GET | `/api/admin/consultations` | Bearer JWT (Admin) | List consultations with filters |
| 13 | GET | `/api/admin/consultations/{consultationId}` | Bearer JWT (Admin) | Get consultation detail |
| 14 | GET | `/api/admin/audit-logs` | Bearer JWT (Admin) | List admin audit log entries |

---

## Authorization

All `/api/admin/*` endpoints require:
```
Authorization: Bearer <jwt>
```
JWT must contain claim `role = Admin`. Requests with any other role receive `403 Forbidden`.

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

## 1. Admin Login

**`POST /api/auth/login`**

> Shared with Auth Module. Admin uses email + password. No OTP flow. No separate admin-specific login endpoint.

### Request Body
```json
{
  "email": "admin@pdc.com",
  "password": "Admin@123",
  "role": "Admin"
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `email` | Required · Valid email format |
| `password` | Required · Min 6 chars |
| `role` | Must be `"Admin"` |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "dGhpcyBpcyBh...",
    "expiresAt": "2026-05-25T14:00:00Z",
    "user": {
      "id": "uuid",
      "fullName": "Platform Admin",
      "email": "admin@pdc.com",
      "role": "Admin"
    }
  }
}
```

### Error Responses
| Status | Scenario |
|--------|----------|
| `401` | Invalid credentials |
| `403` | Account inactive (`IsActive = false`) |
| `422` | Validation failed |

---

## 2. Dashboard

**`GET /api/admin/dashboard`**

> Returns aggregated platform statistics for the admin operational dashboard. Single-query response — no N+1.

### Authorization
Bearer JWT — Role: `Admin`

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "totalDoctors": 142,
    "pendingDoctors": 18,
    "suspendedDoctors": 4,
    "totalActivePatients": 3870,
    "totalConsultations": 12450,
    "completedConsultations": 11200,
    "cancelledConsultations": 890,
    "todayConsultations": 76
  }
}
```

---

## 3. List Pending Doctors

**`GET /api/admin/doctors/pending`**

> Returns all doctors with `ApprovalStatus = Pending`. Used as the primary moderation queue.

### Authorization
Bearer JWT — Role: `Admin`

### Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| `page` | int | Page number (default: 1) |
| `pageSize` | int | Results per page (default: 20, max: 100) |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "doctorId": "uuid",
        "userId": "uuid",
        "fullName": "Dr. Priya Sharma",
        "email": "priya@example.com",
        "specialization": "Dermatologist",
        "qualification": "MBBS, MD",
        "licenseNumber": "MH-2021-789012",
        "experienceYears": 5,
        "city": "Pune",
        "isProfileCompleted": true,
        "createdAt": "2026-05-20T08:30:00Z"
      }
    ],
    "totalCount": 18,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 4. List All Doctors

**`GET /api/admin/doctors`**

> Full doctor listing with status filter. Used for ongoing moderation oversight.

### Authorization
Bearer JWT — Role: `Admin`

### Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| `approvalStatus` | string | Filter: `Pending`, `Approved`, `Rejected`, `Suspended` |
| `city` | string | Filter by city |
| `search` | string | Name or license number search |
| `page` | int | Page number (default: 1) |
| `pageSize` | int | Results per page (default: 20) |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "doctorId": "uuid",
        "fullName": "Dr. Anil Mehta",
        "email": "anil@example.com",
        "specialization": "Cardiologist",
        "approvalStatus": "Approved",
        "isPubliclyVisible": true,
        "city": "Mumbai",
        "createdAt": "2026-04-10T10:00:00Z"
      }
    ],
    "totalCount": 142,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 5. Approve Doctor

**`PATCH /api/admin/doctors/{doctorId}/approve`**

> Sets `ApprovalStatus = Approved`. If `IsProfileCompleted = true`, also sets `IsPubliclyVisible = true`. Creates audit log entry.

### Authorization
Bearer JWT — Role: `Admin`

### Request Body
```json
{
  "reason": "License verified. Profile complete."
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `reason` | Optional · Max 500 chars |
| `doctorId` | Must exist · Must be in `Pending` or `Rejected` status |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "doctorId": "uuid",
    "approvalStatus": "Approved",
    "isPubliclyVisible": true
  },
  "message": "Doctor approved successfully."
}
```

### Error Responses
| Status | Scenario |
|--------|----------|
| `404` | Doctor not found |
| `409` | Doctor already in `Approved` state |
| `403` | JWT role is not Admin |

---

## 6. Reject Doctor

**`PATCH /api/admin/doctors/{doctorId}/reject`**

> Sets `ApprovalStatus = Rejected`, `IsPubliclyVisible = false`. Creates audit log entry.

### Authorization
Bearer JWT — Role: `Admin`

### Request Body
```json
{
  "reason": "License number could not be verified with medical council."
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `reason` | Required · Max 500 chars |
| `doctorId` | Must exist · Must be in `Pending` status |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "doctorId": "uuid",
    "approvalStatus": "Rejected",
    "isPubliclyVisible": false
  },
  "message": "Doctor rejected."
}
```

### Error Responses
| Status | Scenario |
|--------|----------|
| `404` | Doctor not found |
| `409` | Doctor not in `Pending` status |
| `422` | `reason` missing |

---

## 7. Suspend Doctor

**`PATCH /api/admin/doctors/{doctorId}/suspend`**

> Sets `ApprovalStatus = Suspended`, `IsPubliclyVisible = false`. New bookings blocked. Existing consultations unaffected. Creates audit log.

### Authorization
Bearer JWT — Role: `Admin`

### Request Body
```json
{
  "reason": "Reported for inappropriate conduct during consultation."
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `reason` | Required · Max 500 chars |
| `doctorId` | Must exist · Must be in `Approved` status |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "doctorId": "uuid",
    "approvalStatus": "Suspended",
    "isPubliclyVisible": false
  },
  "message": "Doctor suspended."
}
```

### Error Responses
| Status | Scenario |
|--------|----------|
| `404` | Doctor not found |
| `409` | Doctor not in `Approved` status |
| `422` | `reason` missing |

---

## 8. Reactivate Doctor

**`PATCH /api/admin/doctors/{doctorId}/reactivate`**

> Restores `ApprovalStatus = Approved` from `Suspended`. Sets `IsPubliclyVisible = true` if `IsProfileCompleted = true`. Creates audit log.

### Authorization
Bearer JWT — Role: `Admin`

### Request Body
```json
{
  "reason": "Suspension lifted. Conduct issue resolved."
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `reason` | Optional · Max 500 chars |
| `doctorId` | Must exist · Must be in `Suspended` status |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "doctorId": "uuid",
    "approvalStatus": "Approved",
    "isPubliclyVisible": true
  },
  "message": "Doctor reactivated."
}
```

---

## 9. List Patients

**`GET /api/admin/patients`**

> Full patient listing with optional search and active/blocked filter.

### Authorization
Bearer JWT — Role: `Admin`

### Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| `isActive` | bool | Filter active (`true`) or blocked (`false`) patients |
| `search` | string | Name or phone number search |
| `page` | int | Page number (default: 1) |
| `pageSize` | int | Results per page (default: 20) |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "userId": "uuid",
        "fullName": "Ravi Kumar",
        "phoneNumber": "+919876543210",
        "isActive": true,
        "isVerified": true,
        "createdAt": "2026-03-15T09:00:00Z"
      }
    ],
    "totalCount": 3870,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 10. Block Patient

**`PATCH /api/admin/patients/{userId}/block`**

> Sets `Users.IsActive = false` for the patient. Patient cannot login after this action. Creates audit log.

### Authorization
Bearer JWT — Role: `Admin`

### Request Body
```json
{
  "reason": "Repeated fraudulent chargebacks reported."
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `reason` | Required · Max 500 chars |
| `patientId` | Must exist · `Role = Patient` · `IsActive = true` |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "isActive": false
  },
  "message": "Patient account blocked."
}
```

### Error Responses
| Status | Scenario |
|--------|----------|
| `404` | Patient not found |
| `409` | Patient already blocked |
| `422` | `reason` missing |

---

## 11. Unblock Patient

**`PATCH /api/admin/patients/{userId}/unblock`**

> Sets `Users.IsActive = true`. Restores patient login access. Creates audit log.

### Authorization
Bearer JWT — Role: `Admin`

### Request Body
```json
{
  "reason": "Issue resolved after review."
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `reason` | Optional · Max 500 chars |
| `patientId` | Must exist · `Role = Patient` · `IsActive = false` |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "isActive": true
  },
  "message": "Patient account unblocked."
}
```

---

## 12. List Consultations

**`GET /api/admin/consultations`**

> Read-only consultation monitoring. Supports multi-dimensional filtering. Admin cannot modify consultation records.

### Authorization
Bearer JWT — Role: `Admin`

### Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter: `Scheduled`, `InProgress`, `Completed`, `Cancelled` |
| `doctorId` | uuid | Filter by doctor |
| `patientId` | uuid | Filter by patient |
| `dateFrom` | date | Start of date range (ISO 8601) |
| `dateTo` | date | End of date range (ISO 8601) |
| `page` | int | Page number (default: 1) |
| `pageSize` | int | Results per page (default: 20) |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "consultationId": "uuid",
        "patientName": "Ravi Kumar",
        "doctorName": "Dr. Anil Mehta",
        "specialization": "Cardiologist",
        "status": "Completed",
        "scheduledAt": "2026-05-24T10:00:00Z",
        "completedAt": "2026-05-24T10:35:00Z"
      }
    ],
    "totalCount": 12450,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 13. Get Consultation Detail

**`GET /api/admin/consultations/{consultationId}`**

> Full consultation detail for a specific session. Read-only.

### Authorization
Bearer JWT — Role: `Admin`

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "consultationId": "uuid",
    "patientName": "Ravi Kumar",
    "patientPhone": "+919876543210",
    "doctorName": "Dr. Anil Mehta",
    "specialization": "Cardiologist",
    "status": "Completed",
    "scheduledAt": "2026-05-24T10:00:00Z",
    "completedAt": "2026-05-24T10:35:00Z",
    "statusHistory": [
      { "status": "Scheduled", "changedAt": "2026-05-23T18:00:00Z" },
      { "status": "InProgress", "changedAt": "2026-05-24T10:01:00Z" },
      { "status": "Completed", "changedAt": "2026-05-24T10:35:00Z" }
    ]
  }
}
```

### Error Responses
| Status | Scenario |
|--------|----------|
| `404` | Consultation not found |

---

## 14. List Audit Logs

**`GET /api/admin/audit-logs`**

> Paginated audit trail of all admin governance actions. Append-only — no delete permitted.

### Authorization
Bearer JWT — Role: `Admin`

### Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| `adminUserId` | uuid | Filter by specific admin operator |
| `actionType` | string | Filter: `DoctorApproved`, `DoctorRejected`, `DoctorSuspended`, `DoctorReactivated`, `PatientBlocked`, `PatientUnblocked` |
| `targetEntityType` | string | Filter: `Doctor`, `Patient` |
| `targetEntityId` | uuid | Filter actions against a specific entity |
| `dateFrom` | date | Start of date range |
| `dateTo` | date | End of date range |
| `page` | int | Page number (default: 1) |
| `pageSize` | int | Results per page (default: 20) |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "adminUserId": "uuid",
        "adminName": "Platform Admin",
        "actionType": "DoctorApproved",
        "targetEntityType": "Doctor",
        "targetEntityId": "uuid",
        "reason": "License verified.",
        "createdAt": "2026-05-25T09:14:22Z"
      }
    ],
    "totalCount": 340,
    "page": 1,
    "pageSize": 20
  }
}
```

