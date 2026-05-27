/**
 * API Response Types
 * Source of truth: backend standard response envelope (all modules)
 */

/** Standard success/error envelope used by all backend endpoints. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  /**
   * Machine-readable error code returned by the backend.
   * Use this (not `message`) to map errors to user-friendly strings.
   * Example values: "INVALID_OTP", "OTP_EXPIRED", "NO_PENDING_OTP",
   * "INVALID_CREDENTIALS", "ACCOUNT_INACTIVE", "INVALID_REFRESH_TOKEN".
   */
  code?: string;
  errors?: Record<string, string[]>;
}

/** Paginated list response envelope. */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}

/** API error shape thrown by the Axios interceptor. */
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

/** Generic query params for paginated requests. */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
