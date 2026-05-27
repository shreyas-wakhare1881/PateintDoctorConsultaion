/**
 * Auth Zod Schemas
 * Source of truth: backend/Modules/Auth/SDD/APIs.md — Validation Rules
 */

import { z } from 'zod';

// ── E.164 Phone Number (full format — used by OTP verify) ─────────────────
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^\+[1-9]\d{6,14}$/, 'Enter a valid number with country code (e.g. +919876543210)');

// ── Local phone number (digits only — used by patient login form) ──────────
// Country code is selected separately and prepended before the API call.
export const localPhoneSchema = z
  .string()
  .min(1, 'Mobile number is required')
  .regex(/^\d{6,15}$/, 'Enter digits only (6–15 numbers, no spaces or dashes)');

// ── OTP ────────────────────────────────────────────────────────────────────
// 4 digits — matches backend VerifyOtpRequestValidator: .Matches(@"^\d{4}$")
export const otpSchema = z
  .string()
  .length(4, 'OTP must be 4 digits')
  .regex(/^\d{4}$/, 'OTP must contain only numbers');

// ── Patient Phone Login ────────────────────────────────────────────────────
// phoneNumber is a LOCAL number only (digits). Country code is a separate state.
export const patientLoginSchema = z.object({
  phoneNumber: localPhoneSchema,
});
export type PatientLoginInput = z.infer<typeof patientLoginSchema>;

// ── OTP Verify ─────────────────────────────────────────────────────────────
export const otpVerifySchema = z.object({
  phoneNumber: phoneSchema,
  otp: otpSchema,
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

// ── Doctor / Admin Login ───────────────────────────────────────────────────
export const credentialLoginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['Doctor', 'Admin']),
});
export type CredentialLoginInput = z.infer<typeof credentialLoginSchema>;

// ── Doctor Registration (backend: min 8 chars + complexity) ───────────────
export const doctorRegisterSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(256, 'Name is too long')
      .regex(/^[a-zA-Z\s.'-]+$/, 'Name contains invalid characters'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address').max(256),
    phoneNumber: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\+[1-9]\d{6,14}$/.test(val),
        'Enter a valid phone number with country code'
      ),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/\d/, 'Must include a number')
      .regex(/[^A-Za-z0-9]/, 'Must include a special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.literal('Doctor'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type DoctorRegisterInput = z.infer<typeof doctorRegisterSchema>;

// ── Patient Profile Setup ──────────────────────────────────────────────────
export const patientSetupSchema = z.object({
  gender: z.enum(['Male', 'Female', 'Other', 'PreferNotToSay'], {
    required_error: 'Please select a gender',
  }),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d < new Date();
    }, 'Enter a valid past date'),
  /**
   * Blood group values MUST match backend PatientValidationConstants.ValidBloodGroups.
   * Backend expects standard notation: "A+", "A-", "B+", etc.
   */
  bloodGroup: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .optional(),
  /**
   * Empty string from <input type="number"> must be treated as undefined (field not filled).
   * z.coerce.number() converts "" to 0, which then fails min() — this preprocess avoids that.
   */
  heightCm: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().min(50, 'Height must be 50–300 cm').max(300, 'Height must be 50–300 cm').optional()
  ),
  weightKg: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().min(1, 'Weight must be 1–500 kg').max(500, 'Weight must be 1–500 kg').optional()
  ),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});
export type PatientSetupInput = z.infer<typeof patientSetupSchema>;

// Legacy aliases (keep for backward compat with existing module hooks)
export const loginSchema = credentialLoginSchema;
export const sendOtpSchema = z.object({ phoneNumber: phoneSchema });
export const verifyOtpSchema = otpVerifySchema;
export type LoginSchema = CredentialLoginInput;
export type SendOtpSchema = z.infer<typeof sendOtpSchema>;
export type VerifyOtpSchema = OtpVerifyInput;

