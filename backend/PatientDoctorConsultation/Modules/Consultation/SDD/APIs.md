# Consultation Module — API Contracts

## POST /api/consultations
**Request:** `{ patientId, doctorId, slotId }`  
**Response:** `{ consultationId, roomId, livekitToken }`

## GET /api/consultations/{id}
**Response:** `{ id, patient, doctor, status, roomId, summary }`

## PUT /api/consultations/{id}/complete
**Request:** `{ notes }`  
**Response:** `{ success }`
