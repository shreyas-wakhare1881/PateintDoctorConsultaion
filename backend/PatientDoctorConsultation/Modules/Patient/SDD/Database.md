# Patient Module — Database Schema

## Table: Patients
| Column         | Type         | Notes           |
|----------------|--------------|------------------|
| Id             | UUID (PK)    | FK → Users.Id   |
| Name           | VARCHAR(200) |                 |
| Phone          | VARCHAR(20)  |                 |
| DateOfBirth    | DATE         |                 |
| MedicalHistory | TEXT         |                 |
| CreatedAt      | TIMESTAMPTZ  |                 |
