/**
 * useLeadDetailAPI Hook
 * 
 * หน้าที่: จัดการรายละเอียดลีด (Lead Detail Management)
 * - ดึงรายละเอียดลีด
 * - ดึง latest log ของลีด
 * - อัปเดตลีด
 * 
 * API: core-leads-lead-detail, core-leads-lead-mutations
 * 
 * ทำไมต้องแก้ไข?
 * - ใช้ API client utility แทน duplicate fetch code
 * - ใช้ centralized types (Lead) แทน any
 * - ลบ hardcoded SUPABASE_URL
 */

import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "@/utils/apiClient";
import type { Lead, LeadUpdate } from "@/types";

export const useLeadDetailAPI = (leadId: number | null) => {
  return useQuery({
    queryKey: ['lead-detail', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get<Lead>('core-leads-lead-detail', {
        leadId: leadId.toString(),
        action: 'detail'
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch lead details');
      }
      
      // Debug: Log response to check structure
      console.log('🔍 API Response:', {
        success: response.success,
        hasData: !!response.data,
        ad_campaign_id: (response.data as any)?.ad_campaign_id,
        dataKeys: response.data ? Object.keys(response.data) : [],
        fullResponse: response
      });
      
      return response.data;
    },
    enabled: !!leadId,
    staleTime: 1000 * 60 * 10, // cache 10 นาที
    gcTime: 1000 * 60 * 60, // cache 1 ชั่วโมง
    refetchOnWindowFocus: false,
  });
};

export const useLeadLatestLogAPI = (leadId: number | null) => {
  return useQuery({
    queryKey: ['latest-lead-log', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get('core-leads-lead-detail', {
        leadId: leadId.toString(),
        action: 'latest-log'
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch latest log');
      }
      
      return response.data;
    },
    enabled: !!leadId,
    staleTime: 1000 * 60 * 5, // cache 5 นาที
    gcTime: 1000 * 60 * 30, // cache 30 นาที
    refetchOnWindowFocus: false,
  });
};

export const useUpdateLeadAPI = () => {
  return async (leadId: number, updates: LeadUpdate) => {
    // ใช้ API client utility แทน duplicate fetch code
    // ใช้ LeadUpdate type แทน any เพื่อ type safety
    // ✅ แก้ไข: เปลี่ยนจาก PUT เป็น POST เพราะ function รองรับเฉพาะ POST
    const api = await createApiClient();
    
    const response = await api.post<Lead>('core-leads-lead-mutations', {
      action: 'update_lead',
      leadId,
      updates
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to update lead');
    }

    return response.data;
  };
};
