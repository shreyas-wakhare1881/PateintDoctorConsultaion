# Doctor Module — API Contracts

## GET /api/doctors/{id}/profile
**Response:** `{ id, name, specialization, availableSlots }`

## PUT /api/doctors/{id}/availability
**Request:** `{ slots: [{ date, startTime, endTime }] }`  
**Response:** `{ success }`
