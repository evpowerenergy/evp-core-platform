/**
 * Utility functions for lead validation and calculation
 * 
 * ทำไมต้องแก้ไขไฟล์นี้?
 * - แทนที่ any types ด้วย Lead type จาก @/types
 * - เพิ่ม type safety และลด runtime errors
 * - ใช้ centralized types แทนการ define types เอง
 * - ใช้ API client utility แทน hardcoded fetch code
 */

import { supabase } from "@/integrations/supabase/client";
import type { Lead, LeadStatus, Platform } from "@/types";

/**
 * Check if a lead has a valid phone number
 * @param lead - The lead object
 * @returns boolean - True if lead has a valid phone number
 * 
 * Note: This function is kept here for backward compatibility.
 * The type guard version is available in @/types/lead.ts
 */
export const hasValidPhone = (lead: Lead): boolean => {
  return !!(lead.tel && lead.tel.trim() !== '');
};

/**
 * Check if a lead has a valid Line ID
 * @param lead - The lead object
 * @returns boolean - True if lead has a valid Line ID
 */
export const hasValidLineId = (lead: Lead): boolean => {
  return !!(lead.line_id && lead.line_id.trim() !== '');
};

/**
 * Check if a lead has valid contact information (phone or Line ID)
 * @param lead - The lead object
 * @returns boolean - True if lead has valid phone or Line ID
 */
export const hasValidContact = (lead: Lead): boolean => {
  return hasValidPhone(lead) || hasValidLineId(lead);
};

/**
 * Filter leads that have valid phone numbers
 * @param leads - Array of leads
 * @returns Array of leads with valid phone numbers
 */
export const filterLeadsWithPhone = (leads: Lead[]): Lead[] => {
  return leads.filter(lead => hasValidPhone(lead));
};

/**
 * Filter leads that have valid Line IDs
 * @param leads - Array of leads
 * @returns Array of leads with valid Line IDs
 */
export const filterLeadsWithLineId = (leads: Lead[]): Lead[] => {
  return leads.filter(lead => hasValidLineId(lead));
};

/**
 * Filter leads that have valid contact information (phone or Line ID)
 * @param leads - Array of leads
 * @returns Array of leads with valid contact information
 */
export const filterLeadsWithContact = (leads: Lead[]): Lead[] => {
  return leads.filter(lead => hasValidContact(lead));
};

/**
 * Calculate total leads with phone number validation
 * @param leads - Array of leads
 * @param requirePhone - Whether to require phone number (default: true)
 * @returns number - Total count of valid leads
 */
export const calculateTotalLeads = (leads: Lead[], requirePhone: boolean = true): number => {
  if (requirePhone) {
    return filterLeadsWithPhone(leads).length;
  }
  return leads.length;
};

/**
 * Calculate total leads with contact validation (phone or Line ID)
 * @param leads - Array of leads
 * @param requireContact - Whether to require contact information (default: true)
 * @returns number - Total count of valid leads
 */
export const calculateTotalLeadsWithContact = (leads: Lead[], requireContact: boolean = true): number => {
  if (requireContact) {
    return filterLeadsWithContact(leads).length;
  }
  return leads.length;
};

/**
 * Calculate assigned leads with phone number validation
 * @param leads - Array of leads
 * @param requirePhone - Whether to require phone number (default: true)
 * @returns number - Count of assigned leads
 */
export const calculateAssignedLeads = (leads: Lead[], requirePhone: boolean = true): number => {
  const validLeads = requirePhone ? filterLeadsWithPhone(leads) : leads;
  return validLeads.filter(lead => lead.sale_owner_id).length;
};

/**
 * Calculate assigned leads with contact validation (phone or Line ID)
 * @param leads - Array of leads
 * @param requireContact - Whether to require contact information (default: true)
 * @returns number - Count of assigned leads
 */
export const calculateAssignedLeadsWithContact = (leads: Lead[], requireContact: boolean = true): number => {
  const validLeads = requireContact ? filterLeadsWithContact(leads) : leads;
  // Include both sale_owner_id and post_sales_owner_id for consistency with Sales Team page
  return validLeads.filter(lead => lead.sale_owner_id || lead.post_sales_owner_id).length;
};

/**
 * Calculate unassigned leads with phone number validation
 * @param leads - Array of leads
 * @param requirePhone - Whether to require phone number (default: true)
 * @returns number - Count of unassigned leads
 */
export const calculateUnassignedLeads = (leads: Lead[], requirePhone: boolean = true): number => {
  const validLeads = requirePhone ? filterLeadsWithPhone(leads) : leads;
  return validLeads.filter(lead => !lead.sale_owner_id).length;
};

/**
 * Calculate unassigned leads with contact validation (phone or Line ID)
 * @param leads - Array of leads
 * @param requireContact - Whether to require contact information (default: true)
 * @returns number - Count of unassigned leads
 */
export const calculateUnassignedLeadsWithContact = (leads: Lead[], requireContact: boolean = true): number => {
  const validLeads = requireContact ? filterLeadsWithContact(leads) : leads;
  // Unassigned = no sale_owner_id AND no post_sales_owner_id
  return validLeads.filter(lead => !lead.sale_owner_id && !lead.post_sales_owner_id).length;
};

/**
 * Calculate assignment rate with phone number validation
 * @param leads - Array of leads
 * @param requirePhone - Whether to require phone number (default: true)
 * @returns number - Assignment rate percentage
 */
export const calculateAssignmentRate = (leads: Lead[], requirePhone: boolean = true): number => {
  const totalLeads = calculateTotalLeads(leads, requirePhone);
  const assignedLeads = calculateAssignedLeads(leads, requirePhone);
  return totalLeads > 0 ? (assignedLeads / totalLeads) * 100 : 0;
};

/**
 * Calculate assignment rate with contact validation (phone or Line ID)
 * @param leads - Array of leads
 * @param requireContact - Whether to require contact information (default: true)
 * @returns number - Assignment rate percentage
 */
export const calculateAssignmentRateWithContact = (leads: Lead[], requireContact: boolean = true): number => {
  const totalLeads = calculateTotalLeadsWithContact(leads, requireContact);
  const assignedLeads = calculateAssignedLeadsWithContact(leads, requireContact);
  return totalLeads > 0 ? (assignedLeads / totalLeads) * 100 : 0;
};

/**
 * Calculate leads by status with phone number validation
 * @param leads - Array of leads
 * @param status - Status to filter by
 * @param requirePhone - Whether to require phone number (default: true)
 * @returns number - Count of leads with specified status
 */
export const calculateLeadsByStatus = (leads: Lead[], status: LeadStatus | string, requirePhone: boolean = true): number => {
  const validLeads = requirePhone ? filterLeadsWithPhone(leads) : leads;
  return validLeads.filter(lead => lead.status === status).length;
};

/**
 * Calculate leads by status with contact validation (phone or Line ID)
 * @param leads - Array of leads
 * @param status - Status to filter by
 * @param requireContact - Whether to require contact information (default: true)
 * @returns number - Count of leads with specified status
 */
export const calculateLeadsByStatusWithContact = (leads: Lead[], status: LeadStatus | string, requireContact: boolean = true): number => {
  const validLeads = requireContact ? filterLeadsWithContact(leads) : leads;
  return validLeads.filter(lead => lead.status === status).length;
};

/**
 * Calculate leads by platform with phone number validation
 * @param leads - Array of leads
 * @param platform - Platform to filter by
 * @param requirePhone - Whether to require phone number (default: true)
 * @returns number - Count of leads with specified platform
 */
export const calculateLeadsByPlatform = (leads: Lead[], platform: Platform | string, requirePhone: boolean = true): number => {
  const validLeads = requirePhone ? filterLeadsWithPhone(leads) : leads;
  return validLeads.filter(lead => lead.platform === platform).length;
};

/**
 * Calculate leads by platform with contact validation (phone or Line ID)
 * @param leads - Array of leads
 * @param platform - Platform to filter by
 * @param requireContact - Whether to require contact information (default: true)
 * @returns number - Count of leads with specified platform
 */
export const calculateLeadsByPlatformWithContact = (leads: Lead[], platform: Platform | string, requireContact: boolean = true): number => {
  const validLeads = requireContact ? filterLeadsWithContact(leads) : leads;
  return validLeads.filter(lead => lead.platform === platform).length;
};

/**
 * Calculate EV leads (has phone + not Huawei)
 * @param leads - Array of leads
 * @returns number - Count of EV leads
 */
export const calculateEVLeads = (leads: Lead[]): number => {
  return leads.filter(lead => {
    const hasPhone = hasValidPhone(lead);
    const p = (lead.platform || '').toLowerCase();
    const notFromPartner = p !== 'huawei' && p !== 'huawei (c&i)';
    return hasPhone && notFromPartner;
  }).length;
};

/**
 * Calculate EV leads with contact validation (has phone or Line ID + not Huawei)
 * @param leads - Array of leads
 * @returns number - Count of EV leads
 */
export const calculateEVLeadsWithContact = (leads: Lead[]): number => {
  return leads.filter(lead => {
    const hasContact = hasValidContact(lead);
    const p = (lead.platform || '').toLowerCase();
    const notFromPartner = p !== 'huawei' && p !== 'huawei (c&i)';
    return hasContact && notFromPartner;
  }).length;
};

/**
 * Calculate Huawei leads
 * @param leads - Array of leads
 * @returns number - Count of Huawei leads
 */
export const calculateHuaweiLeads = (leads: Lead[]): number => {
  return leads.filter(lead => {
    const isHuawei = lead.platform && lead.platform.toLowerCase() === 'huawei';
    return isHuawei;
  }).length;
};

/**
 * Calculate Huawei leads with contact validation (has phone or Line ID + is Huawei)
 * @param leads - Array of leads
 * @returns number - Count of Huawei leads
 */
export const calculateHuaweiLeadsWithContact = (leads: Lead[]): number => {
  return leads.filter(lead => {
    const isHuawei = lead.platform && lead.platform.toLowerCase() === 'huawei';
    const hasContact = hasValidContact(lead);
    return isHuawei && hasContact;
  }).length;
};

/**
 * Calculate closed deals with phone number validation
 * @param leads - Array of leads
 * @param requirePhone - Whether to require phone number (default: true)
 * @returns number - Count of closed deals
 */
export const calculateClosedDeals = (leads: Lead[], requirePhone: boolean = true): number => {
  return calculateLeadsByStatus(leads, 'ปิดการขาย', requirePhone);
};

/**
 * Calculate closed deals with contact validation (phone or Line ID)
 * @param leads - Array of leads
 * @param requireContact - Whether to require contact information (default: true)
 * @returns number - Count of closed deals
 */
export const calculateClosedDealsWithContact = (leads: Lead[], requireContact: boolean = true): number => {
  return calculateLeadsByStatusWithContact(leads, 'ปิดการขาย', requireContact);
};

/**
 * Calculate conversion rate with phone number validation
 * @param leads - Array of leads
 * @param requirePhone - Whether to require phone number (default: true)
 * @returns number - Conversion rate percentage
 */
export const calculateConversionRate = (leads: Lead[], requirePhone: boolean = true): number => {
  const totalLeads = calculateTotalLeads(leads, requirePhone);
  const closedDeals = calculateClosedDeals(leads, requirePhone);
  return totalLeads > 0 ? (closedDeals / totalLeads) * 100 : 0;
};

/**
 * Calculate conversion rate with contact validation (phone or Line ID)
 * @param leads - Array of leads
 * @param requireContact - Whether to require contact information (default: true)
 * @returns number - Conversion rate percentage
 */
export const calculateConversionRateWithContact = (leads: Lead[], requireContact: boolean = true): number => {
  const totalLeads = calculateTotalLeadsWithContact(leads, requireContact);
  const closedDeals = calculateClosedDealsWithContact(leads, requireContact);
  return totalLeads > 0 ? (closedDeals / totalLeads) * 100 : 0;
};

/**
 * Check if a phone number already exists in the leads table
 * @param phoneNumber - The phone number to check
 * @param excludeId - Optional ID to exclude from the check (for updates)
 * @returns Promise<boolean> - True if phone number exists, false otherwise
 */
export const checkPhoneNumberDuplicate = async (phoneNumber: string, excludeId?: number): Promise<boolean> => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return false;
  }

  try {
    let query = supabase
      .from('leads')
      .select('id, tel')
      .eq('tel', phoneNumber.trim());

    // Exclude current lead if updating
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking phone number duplicate:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking phone number duplicate:', error);
    return false;
  }
};

/**
 * Normalize phone number for comparison (remove spaces, dashes, etc.)
 * @param phoneNumber - The phone number to normalize
 * @returns string - Normalized phone number
 */
export const normalizePhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  
  // Trim whitespace first, then remove all non-digit characters (for Thai numbers, we don't need +)
  // This ensures consistent normalization across the app
  return phoneNumber.trim().replace(/[^\d]/g, '');
};

/**
 * Check if a phone number already exists in the leads table (with normalization)
 * @param phoneNumber - The phone number to check
 * @param excludeId - Optional ID to exclude from the check (for updates)
 * @returns Promise<boolean> - True if phone number exists, false otherwise
 */
export const checkPhoneNumberDuplicateNormalized = async (phoneNumber: string, excludeId?: number): Promise<boolean> => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    console.log('[Phone Check] Empty phone number');
    return false;
  }

  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  
  if (normalizedPhone.length < 8) {
    console.log('[Phone Check] Phone number too short:', normalizedPhone);
    return false; // Too short to be a valid phone number
  }

  try {
    console.log('[Phone Check] Checking phone:', normalizedPhone);
    
    // ใช้ API client utility แทน duplicate fetch code
    const { createApiClient } = await import('@/utils/apiClient');
    const api = await createApiClient();
    
    const response = await api.post<{ isDuplicate: boolean }>('core-leads-phone-validation', {
      phone: normalizedPhone,
      excludeId: excludeId || null
    });

    if (!response.success || !response.data) {
      console.error('[Phone Check] Error response:', response.error);
      return false;
    }

    console.log('[Phone Check] Result:', response.data);
    return response.data.isDuplicate === true;
  } catch (error) {
    console.error('[Phone Check] Exception:', error);
    return false;
  }
}; 