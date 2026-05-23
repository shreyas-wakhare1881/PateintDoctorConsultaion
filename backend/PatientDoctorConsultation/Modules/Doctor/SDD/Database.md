# Doctor Module — Database Schema

## Table: Doctors
| Column         | Type         | Notes           |
|----------------|--------------|------------------|
| Id             | UUID (PK)    | FK → Users.Id   |
| Name           | VARCHAR(200) |                 |
| Specialization | VARCHAR(100) |                 |
| Bio            | TEXT         |                 |
| IsVerified     | BOOLEAN      | Default false   |

## Table: AvailabilitySlots
| Column    | Type        | Notes           |
|-----------|-------------|------------------|
| Id        | UUID (PK)   |                 |
| DoctorId  | UUID (FK)   | → Doctors.Id   |
| Date      | DATE        |                 |
| StartTime | TIME        |                 |
| EndTime   | TIME        |                 |
| IsBooked  | BOOLEAN     | Default false   |
