# Doctor Module — API Contract Specification

> **Module:** Doctor  
> **Base Path:** `/api/doctors`  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-24

---

## Quick Reference

| # | Method | Route | Auth Required | Purpose |
|---|--------|-------|---------------|---------|
| 1 | POST | `/api/doctors/profile` | Bearer JWT (Doctor) | Create doctor profile |
| 2 | GET | `/api/doctors/me` | Bearer JWT (Doctor) | Get own profile |
| 3 | PUT | `/api/doctors/me` | Bearer JWT (Doctor) | Update own profile |
| 4 | POST | `/api/doctors/availability` | Bearer JWT (Doctor) | Add availability slot |
| 5 | GET | `/api/doctors/availability` | Bearer JWT (Doctor) | Get own availability |
| 6 | PUT | `/api/doctors/availability/{id}` | Bearer JWT (Doctor) | Update availability slot |
| 7 | DELETE | `/api/doctors/availability/{id}` | Bearer JWT (Doctor) | Delete availability slot |
| 8 | GET | `/api/doctors` | None | Public doctor listing |
| 9 | GET | `/api/doctors/{doctorId}` | None | Public doctor details |

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

## 1. Create Doctor Profile

**`POST /api/doctors/profile`**

> Creates the professional profile for a registered doctor. Called once during onboarding. Profile is created in `Pending` approval state.

### Authorization
Bearer JWT — Role: `Doctor`

### Request Body
```json
{
  "specialization": "Cardiologist",
  "qualification": "MBBS, MD (Cardiology)",
  "experienceYears": 8,
  "licenseNumber": "MH-2016-123456",
  "bio": "Senior cardiologist with 8 years of experience at Lilavati Hospital.",
  "consultationFee": 800.00,
  "hospitalName": "Lilavati Hospital",
  "clinicAddress": "A-791, Bandra Reclamation, Bandra West",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "languagesSpoken": ["English", "Hindi", "Marathi"]
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `specialization` | Required · Max 256 chars |
| `qualification` | Required · Max 512 chars |
| `experienceYears` | Required · Min 0 · Max 80 |
| `licenseNumber` | Required · Unique across platform |
| `consultationFee` | Required · Min 0 |
| `city` | Required · Max 100 chars |

### Success Response — `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "approvalStatus": "Pending",
    "isProfileCompleted": true,
    "isPubliclyVisible": false
  },
  "message": "Profile created. Awaiting admin approval."
}
```

### Error Responses
| Status | Code | Scenario |
|--------|------|----------|
| `400` | `VALIDATION_ERROR` | Missing required fields |
| `409` | `PROFILE_EXISTS` | Doctor profile already created |
| `409` | `LICENSE_DUPLICATE` | License number already registered |

### Business Rules
- Profile can only be created once per user (enforced by `UQ_Doctors_UserId`)
- `ApprovalStatus` defaults to `Pending` on creation — cannot be set by the doctor
- `IsProfileCompleted` is evaluated automatically based on required field presence
- `IsPubliclyVisible` is set to `false` on creation regardless of profile completeness

---

## 2. Get Current Doctor Profile

**`GET /api/doctors/me`**

> Returns the full profile of the currently authenticated doctor.

### Authorization
Bearer JWT — Role: `Doctor`

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "fullName": "Dr. Arjun Mehta",
    "email": "arjun.mehta@example.com",
    "specialization": "Cardiologist",
    "qualification": "MBBS, MD (Cardiology)",
    "experienceYears": 8,
    "licenseNumber": "MH-2016-123456",
    "bio": "...",
    "profileImageUrl": "https://cdn.example.com/profiles/uuid.jpg",
    "consultationFee": 800.00,
    "hospitalName": "Lilavati Hospital",
    "clinicAddress": "...",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "languagesSpoken": ["English", "Hindi", "Marathi"],
    "approvalStatus": "Approved",
    "rating": 4.7,
    "totalReviews": 142,
    "totalConsultations": 310,
    "isProfileCompleted": true,
    "isPubliclyVisible": true,
    "createdAt": "2026-01-15T10:30:00Z",
    "updatedAt": "2026-05-20T08:00:00Z"
  }
}
```

### Business Rules
- Returns full profile including private fields (unlike the public endpoint)
- `fullName` and `email` sourced from `Users` table via join

---

## 3. Update Doctor Profile

**`PUT /api/doctors/me`**

> Updates the authenticated doctor's profile fields. All fields are optional — partial update supported.

### Authorization
Bearer JWT — Role: `Doctor`

### Request Body
```json
{
  "bio": "Updated bio text.",
  "consultationFee": 900.00,
  "city": "Pune",
  "languagesSpoken": ["English", "Hindi"],
  "hospitalName": "Ruby Hall Clinic"
}
```

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isProfileCompleted": true,
    "updatedAt": "2026-05-24T12:00:00Z"
  },
  "message": "Profile updated successfully."
}
```

### Error Responses
| Status | Code | Scenario |
|--------|------|----------|
| `400` | `VALIDATION_ERROR` | Field value violates validation rule |
| `409` | `LICENSE_DUPLICATE` | Updated license number already taken |
| `404` | `PROFILE_NOT_FOUND` | Doctor profile does not exist |

### Business Rules
- `ApprovalStatus` cannot be changed by the doctor via this endpoint
- After a `Rejected` doctor updates their profile, they must notify Admin to re-review (future: auto re-queue)
- `IsProfileCompleted` and `IsPubliclyVisible` are re-evaluated on every update

---

## 4. Add Availability Slot

**`POST /api/doctors/availability`**

> Adds a new recurring weekly availability slot for the doctor.

### Authorization
Bearer JWT — Role: `Doctor` · `ApprovalStatus = Approved`

### Request Body
```json
{
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "13:00",
  "slotDurationMinutes": 30
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `dayOfWeek` | Required · Integer 0–6 |
| `startTime` | Required · Valid time format `HH:mm` |
| `endTime` | Required · Must be after `startTime` |
| `slotDurationMinutes` | Required · Min 10 · Max 120 |

### Success Response — `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "13:00",
    "slotDurationMinutes": 30,
    "isAvailable": true
  }
}
```

### Error Responses
| Status | Code | Scenario |
|--------|------|----------|
| `400` | `VALIDATION_ERROR` | Invalid time range or values |
| `403` | `APPROVAL_REQUIRED` | Doctor not yet approved |

---

## 5. Get Doctor Availability

**`GET /api/doctors/availability`**

> Returns all availability slots configured by the authenticated doctor.

### Authorization
Bearer JWT — Role: `Doctor`

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "13:00",
      "slotDurationMinutes": 30,
      "isAvailable": true
    },
    {
      "id": "uuid",
      "dayOfWeek": 3,
      "startTime": "17:00",
      "endTime": "20:00",
      "slotDurationMinutes": 30,
      "isAvailable": false
    }
  ]
}
```

---

## 6. Update Availability Slot

**`PUT /api/doctors/availability/{id}`**

> Updates a specific availability slot — modify times or toggle availability.

### Authorization
Bearer JWT — Role: `Doctor`

### Path Parameter
| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Availability slot ID |

### Request Body
```json
{
  "startTime": "10:00",
  "endTime": "14:00",
  "slotDurationMinutes": 45,
  "isAvailable": false
}
```

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isAvailable": false,
    "updatedAt": "2026-05-24T12:00:00Z"
  },
  "message": "Availability updated."
}
```

### Error Responses
| Status | Code | Scenario |
|--------|------|----------|
| `404` | `SLOT_NOT_FOUND` | Slot ID not found |
| `403` | `FORBIDDEN` | Slot belongs to different doctor |

---

## 7. Delete Availability Slot

**`DELETE /api/doctors/availability/{id}`**

> Permanently removes a specific availability slot.

### Authorization
Bearer JWT — Role: `Doctor`

### Path Parameter
| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Availability slot ID |

### Success Response — `200 OK`
```json
{
  "success": true,
  "message": "Availability slot deleted."
}
```

### Error Responses
| Status | Code | Scenario |
|--------|------|----------|
| `404` | `SLOT_NOT_FOUND` | Slot ID not found |
| `403` | `FORBIDDEN` | Slot belongs to different doctor |

### Business Rules
- Hard delete on availability rows (no soft delete)
- If Consultation Module has future bookings on this slot — deletion should be blocked (handled by Consultation Module integration)

---

## 8. Public Doctor Listing

**`GET /api/doctors`**

> Returns a paginated list of publicly visible, approved doctors. No authentication required.

### Authorization
None

### Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| `city` | string | Filter by city |
| `specialization` | string | Filter by specialization |
| `language` | string | Filter by spoken language |
| `minFee` | decimal | Minimum consultation fee |
| `maxFee` | decimal | Maximum consultation fee |
| `page` | int | Page number (default: 1) |
| `pageSize` | int | Items per page (default: 10, max: 50) |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "fullName": "Dr. Arjun Mehta",
        "specialization": "Cardiologist",
        "qualification": "MBBS, MD (Cardiology)",
        "experienceYears": 8,
        "consultationFee": 800.00,
        "rating": 4.7,
        "totalReviews": 142,
        "city": "Mumbai",
        "languagesSpoken": ["English", "Hindi"],
        "profileImageUrl": "https://cdn.example.com/profiles/uuid.jpg"
      }
    ],
    "totalCount": 58,
    "page": 1,
    "pageSize": 10,
    "totalPages": 6
  }
}
```

### Business Rules
- Only returns doctors where `IsPubliclyVisible = true` and `DeletedAt = NULL`
- Private fields (`LicenseNumber`, `UserId`, audit fields) are never exposed
- Response uses `PaginatedResponse<T>` shared envelope

---

## 9. Public Doctor Details

**`GET /api/doctors/{doctorId}`**

> Returns the full public profile of a single doctor including availability.

### Authorization
None

### Path Parameter
| Param | Type | Description |
|-------|------|-------------|
| `doctorId` | UUID | Doctor record ID |

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "Dr. Arjun Mehta",
    "specialization": "Cardiologist",
    "qualification": "MBBS, MD (Cardiology)",
    "experienceYears": 8,
    "bio": "Senior cardiologist with 8 years of experience...",
    "consultationFee": 800.00,
    "hospitalName": "Lilavati Hospital",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "languagesSpoken": ["English", "Hindi", "Marathi"],
    "rating": 4.7,
    "totalReviews": 142,
    "totalConsultations": 310,
    "profileImageUrl": "https://cdn.example.com/profiles/uuid.jpg",
    "availability": [
      {
        "dayOfWeek": 1,
        "startTime": "09:00",
        "endTime": "13:00",
        "slotDurationMinutes": 30
      }
    ]
  }
}
```

### Error Responses
| Status | Code | Scenario |
|--------|------|----------|
| `404` | `DOCTOR_NOT_FOUND` | Doctor not found or not publicly visible |

### Business Rules
- Returns `404` if doctor exists but `IsPubliclyVisible = false`
- Only `IsAvailable = true` availability slots are included in the response

