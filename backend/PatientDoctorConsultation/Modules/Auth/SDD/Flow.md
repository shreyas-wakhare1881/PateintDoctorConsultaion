# Auth Module — Flow

## Login Flow
1. Client sends `POST /api/auth/login` with credentials.
2. AuthController → AuthService.LoginAsync()
3. AuthService validates credentials against database.
4. On success, JwtService generates access + refresh tokens.
5. Tokens returned to client.

## OTP Flow
1. Client sends `POST /api/auth/send-otp` with email.
2. AuthService generates 6-digit OTP, stores in OtpCodes table.
3. OTP sent via email (NotificationService).
4. Client sends `POST /api/auth/verify-otp` with code.
5. AuthService validates OTP expiry and usage.
6. On success, JWT token returned.
