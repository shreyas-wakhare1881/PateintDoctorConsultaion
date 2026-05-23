# Auth Module — Database Schema

## Table: Users
| Column       | Type         | Notes              |
|--------------|--------------|--------------------|
| Id           | UUID (PK)    | Auto-generated     |
| Email        | VARCHAR(256) | Unique, indexed    |
| PasswordHash | TEXT         | BCrypt             |
| Role         | VARCHAR(50)  | Patient/Doctor/Admin |
| CreatedAt    | TIMESTAMPTZ  |                    |

## Table: OtpCodes
| Column    | Type        | Notes               |
|-----------|-------------|---------------------|
| Id        | UUID (PK)   |                     |
| Email     | VARCHAR     | FK → Users.Email    |
| Code      | VARCHAR(6)  |                     |
| ExpiresAt | TIMESTAMPTZ |                     |
| IsUsed    | BOOLEAN     | Default false       |
