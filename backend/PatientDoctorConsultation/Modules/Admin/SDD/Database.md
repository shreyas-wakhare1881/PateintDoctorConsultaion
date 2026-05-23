# Admin Module — Database Schema

## Table: Admins
| Column    | Type        | Notes          |
|-----------|-------------|----------------|
| Id        | UUID (PK)   | FK → Users.Id |
| Name      | VARCHAR(200)|                |
| CreatedAt | TIMESTAMPTZ |                |

> Admin reads from Doctors and Consultations tables directly.
