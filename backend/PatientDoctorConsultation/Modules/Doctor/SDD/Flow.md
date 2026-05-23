# Doctor Module — Flow

## Set Availability
1. Doctor sends PUT /api/doctors/{id}/availability.
2. DoctorController → DoctorService.SetAvailabilityAsync()
3. Service upserts AvailabilitySlots records.
4. Realtime update broadcast via NotificationHub if needed.
