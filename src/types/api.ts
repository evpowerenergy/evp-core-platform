/**
 * Centralized API Types
 * 
 * ทำไมต้องสร้างไฟล์นี้?
 * 1. Standardize API response structure
 * 2. Type safety สำหรับ API calls
 * 3. Consistent error handling
 * 4. Easy to maintain API contracts
 */

/**
 * Standard API response structure
 * ทุก API endpoint ควร return ในรูปแบบนี้
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    hasMore?: boolean;
  };
}

/**
 * API error types
 * สำหรับ categorize errors
 */
export type ApiErrorType = 
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * API error response
 * Standardized error format
 */
export interface ApiError {
  type: ApiErrorType;
  message: string;
  code?: string | number;
  details?: unknown;
}

/**
 * API request options
 * สำหรับ API client configuration
 */
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retry?: {
    attempts: number;
    delay: number;
  };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Filter parameters
 */
export type FilterParams = Record<string, unknown>;

/**
 * Query parameters (รวม pagination, sort, filter)
 */
export interface QueryParams extends PaginationParams {
  sort?: SortParams;
  filters?: FilterParams;
}

/**
 * Type guard: ตรวจสอบว่า response เป็น ApiResponse หรือไม่
 */
export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as ApiResponse<T>).success === 'boolean'
  );
}

/**
 * Type guard: ตรวจสอบว่า response เป็น error หรือไม่
 */
export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'message' in value
  );
}

