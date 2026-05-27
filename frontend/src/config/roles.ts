/**
 * Role Constants
 * Source of truth: backend/Modules/Auth/SDD/README.md — Role System
 */

export const USER_ROLES = {
  Patient: 'Patient',
  Doctor: 'Doctor',
  Admin: 'Admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/** Patient routes — Doctor/Admin cannot access. */
export const PATIENT_ROUTES = ['/patient'];

/** Doctor routes — Patient/Admin cannot access. */
export const DOCTOR_ROUTES = ['/doctor'];

/** Admin routes — Patient/Doctor cannot access. */
export const ADMIN_ROUTES = ['/admin'];

/** Public (auth) routes — redirect to dashboard if already authenticated. */
export const PUBLIC_ROUTES = ['/auth', '/'];

/** Routes accessible to both Patient and Doctor (e.g. video room). */
export const SHARED_PROTECTED_ROUTES = ['/consultation/video'];
