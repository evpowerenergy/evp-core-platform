/**
 * useUserDataAPI Hook
 * 
 * หน้าที่: ดึงข้อมูลผู้ใช้ (User Data)
 * - ดึงข้อมูล user profile
 * - ดึงข้อมูล sales member
 * 
 * API: additional-auth-user-data
 * 
 * ทำไมต้องแก้ไข?
 * - ใช้ API client utility แทน duplicate fetch code
 * - ใช้ centralized types (UserProfile) แทน any
 * - ลบ hardcoded SUPABASE_URL
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { createApiClient } from "@/utils/apiClient";
import type { UserWithProfile } from "@/types";

export const useUserDataAPI = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get<UserWithProfile>('additional-auth-user-data', {
        userId: user.id
      });
      
      if (!response.success) {
        console.error('Error fetching user data:', response.error);
        return null;
      }
      
      return response.data || null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 15, // cache 15 นาที
    gcTime: 1000 * 60 * 60, // cache 1 ชั่วโมง
    refetchOnWindowFocus: false,
  });
};
