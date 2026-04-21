/**
 * Centralized Lead Types
 * 
 * ทำไมต้องสร้างไฟล์นี้?
 * 1. แก้ปัญหา any type - ให้ type safety แทน any
 * 2. Single source of truth - ใช้ types เดียวกันทั้งโปรเจกต์
 * 3. Reuse จาก Supabase types - ไม่ต้อง duplicate types
 * 4. Easy to maintain - แก้ที่เดียวใช้ได้ทุกที่
 */

import { Database } from '@/integrations/supabase/types';
import { LeadStatus, OperationStatus } from '@/utils/leadStatusUtils';

// Reuse Supabase types (single source of truth)
type LeadsTable = Database['public']['Tables']['leads'];

/**
 * Lead type from database
 * ใช้ Supabase auto-generated types แทนที่จะ define ใหม่
 */
export type Lead = LeadsTable['Row'];

/**
 * Lead insert type (for creating new leads)
 */
export type LeadInsert = LeadsTable['Insert'];

/**
 * Lead update type (for updating leads)
 */
export type LeadUpdate = LeadsTable['Update'];

/**
 * Platform types - รองรับ platforms ที่ใช้ในระบบ
 */
export type Platform = 'facebook' | 'line' | 'huawei' | 'instagram' | 'tiktok' | 'other' | null;

/**
 * Lead category types
 */
export type LeadCategory = 'Package' | 'Wholesale' | null;

/**
 * Extended Lead interface with computed properties
 * สำหรับใช้ใน UI components ที่ต้องการ computed fields
 */
export interface LeadWithComputed extends Lead {
  /**
   * Computed: มีเบอร์โทรศัพท์หรือไม่
   */
  hasPhone?: boolean;
  
  /**
   * Computed: มี Line ID หรือไม่
   */
  hasLineId?: boolean;
  
  /**
   * Computed: มีข้อมูลติดต่อ (tel หรือ line_id) หรือไม่
   */
  hasContact?: boolean;
  
  /**
   * Computed: Lead status (typed)
   */
  statusTyped?: LeadStatus;
  
  /**
   * Computed: Operation status (typed)
   */
  operationStatusTyped?: OperationStatus;
  
  /**
   * Computed: Platform (typed)
   */
  platformTyped?: Platform;
}

/**
 * Lead filter options
 * สำหรับ filtering leads ในตาราง
 */
export interface LeadFilters {
  category?: LeadCategory;
  platform?: Platform;
  status?: LeadStatus;
  operationStatus?: OperationStatus;
  saleOwnerId?: number;
  searchTerm?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Lead summary statistics
 * สำหรับแสดงสถิติใน dashboard
 */
export interface LeadStats {
  total: number;
  totalWithPhone: number;
  totalWithContact: number;
  assigned: number;
  unassigned: number;
  byStatus: Record<LeadStatus, number>;
  byPlatform: Record<string, number>;
  assignmentRate: number;
  conversionRate: number;
}

/**
 * Lead mutation response
 * สำหรับ API responses
 */
export interface LeadMutationResponse {
  success: boolean;
  data?: Lead;
  error?: string;
  message?: string;
}

/**
 * Type guard: ตรวจสอบว่า object เป็น Lead หรือไม่
 * 
 * ใช้ทำไม?
 * - Type safety เมื่อรับ data จาก API
 * - Runtime validation
 * - Better error handling
 */
export function isLead(value: unknown): value is Lead {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as Lead).id === 'number'
  );
}

/**
 * Type guard: ตรวจสอบว่า lead มี phone number หรือไม่
 */
export function hasValidPhone(lead: Lead): boolean {
  return !!(lead.tel && lead.tel.trim() !== '');
}

/**
 * Type guard: ตรวจสอบว่า lead มี Line ID หรือไม่
 */
export function hasValidLineId(lead: Lead): boolean {
  return !!(lead.line_id && lead.line_id.trim() !== '');
}

/**
 * Type guard: ตรวจสอบว่า lead มีข้อมูลติดต่อหรือไม่ (tel หรือ line_id)
 */
export function hasValidContact(lead: Lead): boolean {
  return hasValidPhone(lead) || hasValidLineId(lead);
}

