# Auth Module — API Contracts

## POST /api/auth/login
**Request:** `{ email, password, role }`  
**Response:** `{ token, refreshToken, user }`

## POST /api/auth/send-otp
**Request:** `{ email }`  
**Response:** `{ message }`

## POST /api/auth/verify-otp
**Request:** `{ email, otp }`  
**Response:** `{ token }`
