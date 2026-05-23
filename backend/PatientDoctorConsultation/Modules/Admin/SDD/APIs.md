# Admin Module — API Contracts

## GET /api/admin/doctors
**Response:** `[{ id, name, specialization, isVerified }]`

## GET /api/admin/consultations
**Response:** `[{ id, patient, doctor, status, createdAt }]`
