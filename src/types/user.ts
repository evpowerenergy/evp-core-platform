/**
 * Centralized User Types
 * 
 * ทำไมต้องสร้างไฟล์นี้?
 * 1. แก้ปัญหา any type สำหรับ user objects
 * 2. Single source of truth สำหรับ user types
 * 3. Reuse จาก Supabase Auth types
 */

import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

type UsersTable = Database['public']['Tables']['users'];

/**
 * User profile from database
 */
export type UserProfile = UsersTable['Row'];

/**
 * Extended user with profile data
 * รวมข้อมูลจาก Supabase Auth และ database profile
 */
export interface UserWithProfile extends SupabaseUser {
  profile?: UserProfile;
}

/**
 * User role types
 * รองรับ roles ที่ใช้ในระบบ
 */
export type UserRole = 
  | 'super_admin'
  | 'manager_sale'
  | 'manager_marketing'
  | 'manager_hr'
  | 'sale_package'
  | 'sale_wholesale'
  | 'marketing'
  | 'engineer'
  | 'back_office'
  | 'admin_page';

/**
 * User permissions
 * สำหรับตรวจสอบ permissions
 */
export interface UserPermissions {
  canViewLeads: boolean;
  canEditLeads: boolean;
  canAssignLeads: boolean;
  canViewReports: boolean;
  canManageSalesTeam: boolean;
  canManageInventory: boolean;
  canManageMarketing: boolean;
}

/**
 * Auth state
 * สำหรับ auth hooks
 */
export interface AuthState {
  user: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  signingOut: boolean;
}

