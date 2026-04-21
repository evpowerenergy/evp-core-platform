/**
 * Centralized Types Export
 * 
 * ทำไมต้องมีไฟล์นี้?
 * 1. Single import point - import types จากที่เดียว
 * 2. Clean imports - ไม่ต้อง import จากหลายไฟล์
 * 3. Easy refactoring - แก้ import path ที่เดียว
 * 
 * วิธีใช้:
 * import { Lead, LeadStatus, ApiResponse } from '@/types';
 */

// Lead types
export type {
  Lead,
  LeadInsert,
  LeadUpdate,
  LeadWithComputed,
  LeadFilters,
  LeadStats,
  LeadMutationResponse,
  Platform,
  LeadCategory,
} from './lead';

export {
  isLead,
  hasValidPhone,
  hasValidLineId,
  hasValidContact,
} from './lead';

// User types
export type {
  UserProfile,
  UserWithProfile,
  UserRole,
  UserPermissions,
  AuthState,
} from './user';

// API types
export type {
  ApiResponse,
  ApiError,
  ApiErrorType,
  ApiRequestOptions,
  PaginationParams,
  SortParams,
  FilterParams,
  QueryParams,
} from './api';

export {
  isApiResponse,
  isApiError,
} from './api';

// Re-export common types from utils
export type {
  LeadStatus,
  OperationStatus,
} from '@/utils/leadStatusUtils';

