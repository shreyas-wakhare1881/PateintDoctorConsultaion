# Patient Module — API Contracts

## GET /api/patients/{id}/profile
**Response:** `{ id, name, email, phone, medicalHistory }`

## PUT /api/patients/{id}/profile
**Request:** `{ name, phone, medicalHistory }`  
**Response:** `{ success }`
