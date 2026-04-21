/**
 * useAppointmentsAPI Hook
 * 
 * หน้าที่: ดึงข้อมูลนัดหมาย (Appointments)
 * - ดึงนัดหมายสำหรับ sales member (followUp, engineer, payment)
 * 
 * API: core-appointments-appointments
 * 
 * ทำไมต้องแก้ไข?
 * - ใช้ API client utility แทน duplicate fetch code
 * - ลบ hardcoded SUPABASE_URL และ SUPABASE_ANON_KEY
 */

import { useQuery } from "@tanstack/react-query";
import { useUserDataAPI as useUserData } from "./useUserDataAPI";
import { useCacheStrategy } from "@/lib/cacheStrategies";
import { createApiClient } from "@/utils/apiClient";

interface AppointmentsData {
  followUp: unknown[];
  engineer: unknown[];
  payment: unknown[];
}

export const useAppointmentsAPI = () => {
  const { data: userData } = useUserData();
  const salesMember = userData?.salesMember;
  const realtimeCacheStrategy = useCacheStrategy('REALTIME');

  return useQuery({
    queryKey: ['appointments', salesMember?.id],
    queryFn: async () => {
      if (!salesMember?.id) return { followUp: [], engineer: [], payment: [] };

      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get<AppointmentsData>('core-appointments-appointments', {
        salesMemberId: salesMember.id.toString()
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch appointments');
      }

      return response.data;
    },
    enabled: !!salesMember?.id,
    ...realtimeCacheStrategy, // ✅ ใช้ REALTIME cache strategy,
  });
};
