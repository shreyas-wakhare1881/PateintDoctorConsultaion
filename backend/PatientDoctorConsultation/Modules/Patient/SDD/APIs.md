# Patient Module — API Contract Specification

> **Module:** Patient  
> **Base Path:** `/api/patients`  
> **Version:** 1.0  
> **Status:** Active  
> **Last Updated:** 2026-05-24

---

## Quick Reference

| # | Method | Route | Auth Required | Purpose |
|---|--------|-------|---------------|---------|
| 1 | POST | `/api/patients/profile` | Bearer JWT (Patient) | Create patient profile |
| 2 | GET | `/api/patients/me` | Bearer JWT (Patient) | Get own profile |
| 3 | PUT | `/api/patients/me` | Bearer JWT (Patient) | Update patient profile |
| 4 | DELETE | `/api/patients/me` | Bearer JWT (Patient) | Soft delete patient profile |
| 5 | GET | `/api/patients/doctors` | Bearer JWT (Patient) | Patient-facing doctor discovery |

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

## 1. Create Patient Profile

**`POST /api/patients/profile`**

> Creates a healthcare profile for the authenticated patient. Called once during onboarding. Profile is immediately active — no admin approval required.

### Authorization
Bearer JWT — Role: `Patient`

### Request Body
```json
{
  "gender": "Male",
  "dateOfBirth": "2003-08-12",
  "bloodGroup": "O+",
  "heightCm": 175,
  "weightKg": 72.50,
  "allergies": "Dust allergy, Penicillin",
  "chronicDiseases": "Asthma",
  "emergencyContactName": "Rahul Wakhare",
  "emergencyContactPhone": "+919999999999",
  "address": "Baner Road, Near DP Road",
  "city": "Pune",
  "state": "Maharashtra",
  "country": "India"
}
```

### Validation Rules
| Field | Rule |
|-------|------|
| `gender` | Optional · Allowed: `Male`, `Female`, `Other`, `PreferNotToSay` |
| `dateOfBirth` | Optional · ISO-8601 date · Must be a past date · Patient must be ≥ 0 and ≤ 120 years old |
| `bloodGroup` | Optional · Allowed: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` |
| `heightCm` | Optional · Integer · Min 50 · Max 300 |
| `weightKg` | Optional · Decimal · Min 1 · Max 500 |
| `allergies` | Optional · Max 1000 chars |
| `chronicDiseases` | Optional · Max 1000 chars |
| `emergencyContactPhone` | Optional · Must match `^\+[1-9]\d{6,14}$` when provided |
| `city` | Optional · Max 100 chars |
| `state` | Optional · Max 100 chars |
| `country` | Optional · Max 100 chars |

### Success Response — `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "3e4a1b2c-0000-0000-0000-000000000001",
    "userId": "7f8d9e0a-0000-0000-0000-000000000002",
    "fullName": "Shreyas Wakhare",
    "email": "shreyas@example.com",
    "gender": "Male",
    "dateOfBirth": "2003-08-12",
    "bloodGroup": "O+",
    "heightCm": 175,
    "weightKg": 72.50,
    "allergies": "Dust allergy, Penicillin",
    "chronicDiseases": "Asthma",
    "emergencyContactName": "Rahul Wakhare",
    "emergencyContactPhone": "+919999999999",
    "address": "Baner Road, Near DP Road",
    "city": "Pune",
    "state": "Maharashtra",
    "country": "India",
    "profileImageUrl": null,
    "isProfileCompleted": true,
    "createdAt": "2026-05-24T10:00:00Z",
    "updatedAt": null
  },
  "message": "Patient profile created successfully."
}
```

### Error Responses
| Status | Scenario |
|--------|----------|
| `400` | Validation failed — invalid field values |
| `401` | Missing or invalid JWT |
| `403` | JWT role is not `Patient` |
| `409` | Patient profile already exists for this user |

### Business Rules
- Profile can be created only once per user — enforced by `UQ_Patients_UserId`
- `IsProfileCompleted` is evaluated automatically; no admin approval required
- `UserId` is extracted from JWT claim — never accepted from request body

### Edge Case Tests
| Scenario | Expected |
|----------|----------|
| Second `POST` for same user | `409 Conflict` |
| `dateOfBirth` in the future | `400` · `dateOfBirth: ["Date of birth must be in the past."]` |
| `bloodGroup: "Z+"` (invalid) | `400` · `bloodGroup: ["Invalid blood group."]` |
| `emergencyContactPhone: "9999"` (no country code) | `400` · `emergencyContactPhone: ["Phone must include country code."]` |
| Missing JWT | `401 Unauthorized` |
| JWT with role `Doctor` | `403 Forbidden` |

---

## 2. Get Current Patient Profile

**`GET /api/patients/me`**

> Returns the complete healthcare profile of the currently authenticated patient.

### Authorization
Bearer JWT — Role: `Patient`

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "3e4a1b2c-0000-0000-0000-000000000001",
    "userId": "7f8d9e0a-0000-0000-0000-000000000002",
    "fullName": "Shreyas Wakhare",
    "email": "shreyas@example.com",
    "gender": "Male",
    "dateOfBirth": "2003-08-12",
    "bloodGroup": "O+",
    "heightCm": 175,
    "weightKg": 72.50,
    "allergies": "Dust allergy, Penicillin",
    "chronicDiseases": "Asthma",
    "emergencyContactName": "Rahul Wakhare",
    "emergencyContactPhone": "+919999999999",
    "address": "Baner Road, Near DP Road",
    "city": "Pune",
    "state": "Maharashtra",
    "country": "India",
    "profileImageUrl": "https://cdn.example.com/profiles/uuid.jpg",
    "isProfileCompleted": true,
    "createdAt": "2026-05-24T10:00:00Z",
    "updatedAt": "2026-05-24T11:30:00Z"
  }
}
```

### Error Responses
| Status | Scenario |
|--------|----------|
| `401` | Missing or invalid JWT |
| `404` | Patient profile not found — profile not yet created |

### Business Rules
- All fields returned including medical data — no sanitization applied to the authenticated owner
- `fullName` and `email` are sourced from `Users` table via join
- Soft-deleted patients receive `404`

### Edge Case Tests
| Scenario | Expected |
|----------|----------|
| Valid JWT but no profile created yet | `404 Not Found` |
| Soft-deleted profile | `404 Not Found` (global query filter excludes it) |
| JWT of a Doctor trying to call this endpoint | `403 Forbidden` |

---

## 3. Update Patient Profile

**`PUT /api/patients/me`**

> Updates the authenticated patient's healthcare profile. All fields are optional — partial update supported.

### Authorization
Bearer JWT — Role: `Patient`

### Request Body
```json
{
  "bloodGroup": "A+",
  "weightKg": 74.00,
  "allergies": "Dust allergy, Penicillin, Shellfish",
  "city": "Mumbai",
  "emergencyContactName": "Priya Wakhare",
  "emergencyContactPhone": "+919988776655"
}
```

### Success Response — `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "3e4a1b2c-0000-0000-0000-000000000001",
    "isProfileCompleted": true,
    "updatedAt": "2026-05-24T14:00:00Z"
  },
  "message": "Profile updated successfully."
}
```

### Error Responses
| Status | Scenario |
|--------|----------|
| `400` | Validation failed on submitted fields |
| `401` | Missing or invalid JWT |
| `404` | Patient profile not found |

### Business Rules
- Only non-null fields in the request body are applied (PATCH semantics on a PUT route)
- `IsProfileCompleted` is re-evaluated after every update
- `UserId` cannot be changed — it is bound to the JWT

### Edge Case Tests
| Scenario | Expected |
|----------|----------|
| Empty request body `{}` | `200 OK` — no changes applied |
| `weightKg: -5` | `400` · `weightKg: ["Weight must be greater than 0."]` |
| `dateOfBirth` set to today | `400` · `dateOfBirth: ["Date of birth must be in the past."]` |
| Provide `userId` in body | Field ignored — `UserId` is JWT-bound |

---

## 4. Soft Delete Patient Profile

**`DELETE /api/patients/me`**

> Soft-deletes the authenticated patient's healthcare profile. The record is retained in the database with a `DeletedAt` timestamp for audit and compliance.

### Authorization
Bearer JWT — Role: `Patient`

### Request Body
None required.

### Success Response — `200 OK`
```json
{
  "success": true,
  "message": "Patient profile deleted successfully."
}
```

### Error Responses
| Status | Scenario |
|--------|----------|
| `401` | Missing or invalid JWT |
| `404` | Patient profile not found or already deleted |

### Business Rules
- Sets `DeletedAt = UTC now` on the `Patients` row — no data is destroyed
- Global EF query filter (`DeletedAt == null`) excludes this record from all future queries
- The `Users` row is NOT affected — user account remains active
- Patient can create a new profile by calling `POST /api/patients/profile` again

### Edge Case Tests
| Scenario | Expected |
|----------|----------|
| Call `DELETE` twice | Second call returns `404` (profile already soft-deleted) |
| Call `GET /me` after delete | `404 Not Found` |
| Call `POST /profile` after delete | `201 Created` — new profile row created (old row retained in DB with `DeletedAt`) |

---

## 5. Patient-Facing Doctor Discovery

**`GET /api/patients/doctors`**

> Returns a paginated list of publicly visible, approved doctors. Authenticated route — requires patient JWT but does not expose any patient data in the response.

### Authorization
Bearer JWT — Role: `Patient`

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `city` | string | No | Filter by city of practice |
| `specialization` | string | No | Filter by medical specialty |
| `language` | string | No | Filter by spoken language |
| `minFee` | decimal | No | Minimum consultation fee filter |
| `maxFee` | decimal | No | Maximum consultation fee filter |
| `page` | int | No | Page number (default: 1) |
| `pageSize` | int | No | Results per page (default: 10, max: 50) |

### Example Request
```
GET /api/patients/doctors?city=Pune&specialization=Cardiologist&page=1&pageSize=10
```

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
        "city": "Pune",
        "languagesSpoken": ["English", "Hindi"],
        "profileImageUrl": "https://cdn.example.com/profiles/uuid.jpg"
      }
    ],
    "totalCount": 1,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

### Business Rules
- Returns only doctors where `IsPubliclyVisible = true` AND `ApprovalStatus = Approved`
- No patient data or medical information is ever included in this response
- This route is a **patient-scoped proxy** to the Doctor Module's public listing — identical data, different auth context
- Results are ordered by `Rating` descending, then `City`, then doctor name

### Edge Case Tests
| Scenario | Expected |
|----------|----------|
| No doctors match filters | `200 OK` with `items: []`, `totalCount: 0` |
| `pageSize: 200` (exceeds max) | Clamped to 50 |
| `minFee: 5000, maxFee: 100` (inverted range) | `200 OK` with `items: []` (no match) |
| JWT with role `Doctor` | `403 Forbidden` |
| `language=Marathi` (no matches) | `200 OK` with `items: []` |

