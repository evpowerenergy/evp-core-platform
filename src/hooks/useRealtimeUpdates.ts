import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QUERY_KEYS } from '@/lib/queryKeys';
import { useGlobalRealtime } from './useGlobalRealtime';
import { selectiveInvalidate, detectEventType } from '@/lib/realtimeOptimization';

/**
 * ✅ ปรับปรุง Custom hook สำหรับ real-time updates
 * ใช้ Global Realtime System แทนการสร้าง subscription แยกกัน
 * ลดปัญหา Duplicate Subscriptions และ Aggressive Invalidation
 */
export const useRealtimeUpdates = (userId?: string) => {
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  
  // ✅ ใช้ Global Realtime System
  const { isConnected, subscriberCount } = useGlobalRealtime(userId);

  // ✅ Manual refresh function ที่ใช้ selective invalidation
  const manualRefresh = () => {
    // Invalidate เฉพาะ queries ที่จำเป็น
    selectiveInvalidate(queryClient, 'leads_update', { debounceMs: 100 });
  };

  // ✅ Legacy functions - เก็บไว้เพื่อ backward compatibility
  const invalidateAllRelatedQueries = useCallback(() => {
    selectiveInvalidate(queryClient, 'leads_update', { debounceMs: 100 });
  }, [queryClient]);

  const invalidateMyLeadsQueries = useCallback(() => {
    selectiveInvalidate(queryClient, 'leads_update', { debounceMs: 100 });
  }, [queryClient]);

  const invalidateAppointmentQueries = useCallback(() => {
    selectiveInvalidate(queryClient, 'appointments_update', { debounceMs: 100 });
  }, [queryClient]);

  const invalidateUserDataQueries = useCallback(() => {
    selectiveInvalidate(queryClient, 'sales_team_update', { debounceMs: 100 });
  }, [queryClient]);

  // ✅ Legacy useEffect - เก็บไว้เพื่อ backward compatibility
  // แต่ตอนนี้ใช้ Global Realtime System แทน
  useEffect(() => {
    if (!userId) return;
    
    // Global system จะจัดการ subscriptions อัตโนมัติ
    // ไม่ต้องสร้าง subscriptions แยกกันอีกต่อไป
  }, [userId, subscriberCount]);

  // ✅ Return connection status และ manual refresh function
  return {
    isConnected,
    subscriberCount,
    manualRefresh,
    reconnect: () => {
      // Global system จะจัดการ reconnect อัตโนมัติ
    }
  };
};