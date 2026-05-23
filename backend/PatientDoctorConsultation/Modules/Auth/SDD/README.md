# Auth Module

## Responsibility
Handles user authentication for Patient, Doctor, and Admin roles.
Supports Email/Password login and OTP-based verification.

## Bounded Context
- User identity management
- JWT token issuance
- OTP generation and validation

## Dependencies
- Infrastructure.Identity.Jwt
- Infrastructure.Identity.OTP
- Shared.Security
