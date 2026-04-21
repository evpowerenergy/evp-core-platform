/**
 * useSalesTeamAPI Hook
 * 
 * หน้าที่: ดึงข้อมูลทีมขาย (Sales Team Management)
 * - ดึงรายการทีมขายทั้งหมด
 * 
 * API: system-management-sales-team-management
 * 
 * ทำไมต้องแก้ไข?
 * - ใช้ API client utility แทน duplicate fetch code
 * - ลบ hardcoded SUPABASE_URL
 */

import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "@/utils/apiClient";

interface SalesTeamMember {
  id: number;
  name: string;
  email: string;
  // Add other sales team properties as needed
}

export const useSalesTeamAPI = () => {
  const { data: salesTeam = [] } = useQuery({
    queryKey: ['sales_team'],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get<SalesTeamMember[]>('system-management-sales-team-management');
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch sales team');
      }
      
      return response.data;
    },
    staleTime: 1000 * 60 * 3, // cache 3 นาที
  });

  return { salesTeam };
};

