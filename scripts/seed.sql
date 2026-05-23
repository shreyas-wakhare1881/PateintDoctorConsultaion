-- PatientDoctorConsultation - Seed Script
-- Run after EF Core migrations have been applied

-- Seed default admin user (password: Admin@1234 - bcrypt hashed)
INSERT INTO "Users" ("Id", "Email", "PasswordHash", "Role", "CreatedAt")
VALUES (
  gen_random_uuid(),
  'admin@pdc.com',
  '$2a$12$placeholderHashReplaceWithRealBcryptHash',
  'Admin',
  NOW()
) ON CONFLICT ("Email") DO NOTHING;
