# Admin Module — Flow

## Doctor Verification Flow
1. Admin calls GET /api/admin/doctors to list unverified doctors.
2. Admin approves via PUT /api/admin/doctors/{id}/verify.
3. Doctor.IsVerified updated to true.
4. NotificationHub broadcasts approval to Doctor.
