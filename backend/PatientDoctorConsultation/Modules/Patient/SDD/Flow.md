# Patient Module — Flow

## Get Profile
1. Authenticated patient calls GET /api/patients/{id}/profile.
2. PatientController → PatientService.GetProfileAsync()
3. Returns mapped PatientProfileDto.

## Update Profile
1. Patient sends PUT /api/patients/{id}/profile.
2. Request validated via FluentValidation.
3. PatientService updates record in database.
