# Consultation Module — Database Schema

## Table: Consultations
| Column      | Type         | Notes                              |
|-------------|--------------|------------------------------------|
| Id          | UUID (PK)    |                                    |
| PatientId   | UUID (FK)    | → Patients.Id                     |
| DoctorId    | UUID (FK)    | → Doctors.Id                      |
| SlotId      | UUID (FK)    | → AvailabilitySlots.Id            |
| Status      | VARCHAR(50)  | Booked/InProgress/Completed/Cancelled |
| RoomId      | VARCHAR(200) | LiveKit room identifier            |
| AiSummary   | TEXT         | BioMistral generated summary       |
| CreatedAt   | TIMESTAMPTZ  |                                    |
| CompletedAt | TIMESTAMPTZ  |                                    |
