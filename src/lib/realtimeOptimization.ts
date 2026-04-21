/**
 * Real-time Updates Optimization System
 * แก้ไขปัญหา Aggressive Invalidation และ Network Overload
 */

import { QueryClient } from '@tanstack/react-query';

// Types for selective invalidation
export type TableChangeEvent = 
  | 'leads_insert' 
  | 'leads_update' 
  | 'leads_delete'
  | 'productivity_logs_insert'
  | 'productivity_logs_update' 
  | 'productivity_logs_delete'
  | 'appointments_insert'
  | 'appointments_update'
  | 'appointments_delete'
  | 'quotations_insert'
  | 'quotations_update'
  | 'quotations_delete'
  | 'sales_team_insert'
  | 'sales_team_update'
  | 'sales_team_delete';

// Mapping ของ table changes กับ queries ที่ต้อง invalidate
export const SELECTIVE_INVALIDATION_MAP: Record<TableChangeEvent, string[]> = {
  // Leads changes - invalidate เฉพาะ leads และ dashboard data
  'leads_insert': ['app_data', 'leads', 'dashboard_stats'],
  'leads_update': ['app_data', 'leads', 'dashboard_stats'],
  'leads_delete': ['app_data', 'leads', 'dashboard_stats'],

  // Productivity logs changes - invalidate เฉพาะ appointments และ leads
  'productivity_logs_insert': ['appointments', 'leads'],
  'productivity_logs_update': ['appointments', 'leads'],
  'productivity_logs_delete': ['appointments', 'leads'],

  // Appointments changes - invalidate เฉพาะ appointments
  'appointments_insert': ['appointments'],
  'appointments_update': ['appointments'],
  'appointments_delete': ['appointments'],

  // Quotations changes - invalidate เฉพาะ appointments และ leads
  'quotations_insert': ['appointments', 'leads'],
  'quotations_update': ['appointments', 'leads'],
  'quotations_delete': ['appointments', 'leads'],

  // Sales team changes - invalidate เฉพาะ sales_team และ user-data
  'sales_team_insert': ['sales_team', 'user-data'],
  'sales_team_update': ['sales_team', 'user-data'],
  'sales_team_delete': ['sales_team', 'user-data'],
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Selective invalidation function
export const selectiveInvalidate = (
  queryClient: QueryClient,
  event: TableChangeEvent,
  options?: {
    debounceMs?: number;
    userId?: string;
    leadId?: number;
  }
) => {
  const { debounceMs = 300, userId, leadId } = options || {};
  
  // Get queries to invalidate
  const queriesToInvalidate = SELECTIVE_INVALIDATION_MAP[event];
  
  if (!queriesToInvalidate) {
    console.warn(`⚠️ No invalidation mapping for event: ${event}`);
    return;
  }

  // ✅ แก้ไข debounced invalidation function ให้ตรงกับ Query Keys
  const debouncedInvalidate = debounce(() => {
    queriesToInvalidate.forEach(queryKey => {
      // Invalidate specific query patterns
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          if (!Array.isArray(key)) return false;
          
          // ✅ Match query key patterns ที่ตรงกับ QUERY_KEYS
          if (queryKey === 'app_data') {
            return key[0] === 'app_data';
          }
          if (queryKey === 'leads') {
            return key[0] === 'leads' || key[0] === 'my_leads';
          }
          if (queryKey === 'appointments') {
            return key[0] === 'appointments';
          }
          if (queryKey === 'sales_team') {
            return key[0] === 'sales_team';
          }
          if (queryKey === 'user-data') {
            return key[0] === 'user-data' || key[0] === 'users';
          }
          if (queryKey === 'dashboard_stats') {
            return key[0] === 'app_data' || key[0] === 'dashboard_stats';
          }
          
          return false;
        }
      });
    });
  }, debounceMs);

  // Execute debounced invalidation
  debouncedInvalidate();
};

// ✅ แก้ไข Optimistic update helpers ให้ใช้ Query Keys ที่ถูกต้อง
export const optimisticUpdateLeads = (
  queryClient: QueryClient,
  newLead: any,
  operation: 'insert' | 'update' | 'delete'
) => {
  // ✅ อัปเดต app_data cache ด้วย query keys ที่ถูกต้อง
  // ใช้ predicate เพื่อหา queries ที่เกี่ยวข้อง
  
  queryClient.setQueriesData(
    {
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && key[0] === 'app_data';
      }
    },
    (oldData: any) => {
      if (!oldData) return oldData;
      
      switch (operation) {
        case 'insert':
          return {
            ...oldData,
            leads: [...(oldData.leads || []), newLead]
          };
        case 'update':
          return {
            ...oldData,
            leads: (oldData.leads || []).map((lead: any) => 
              lead.id === newLead.id ? newLead : lead
            )
          };
        case 'delete':
          return {
            ...oldData,
            leads: (oldData.leads || []).filter((lead: any) => lead.id !== newLead.id)
          };
        default:
          return oldData;
      }
    }
  );

  // ✅ อัปเดต leads cache ด้วย query keys ที่ถูกต้อง
  
  queryClient.setQueriesData(
    {
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && (key[0] === 'leads' || key[0] === 'my_leads');
      }
    },
    (oldData: any) => {
      if (!oldData) return oldData;
      
      switch (operation) {
        case 'insert':
          return [...(oldData || []), newLead];
        case 'update':
          return (oldData || []).map((lead: any) => 
            lead.id === newLead.id ? newLead : lead
          );
        case 'delete':
          return (oldData || []).filter((lead: any) => lead.id !== newLead.id);
        default:
          return oldData;
      }
    }
  );
};

// ✅ แก้ไข optimisticUpdateAppointments ให้ใช้ Query Keys ที่ถูกต้อง
export const optimisticUpdateAppointments = (
  queryClient: QueryClient,
  newAppointment: any,
  operation: 'insert' | 'update' | 'delete'
) => {
  
  // ✅ อัปเดต appointments cache ด้วย query keys ที่ถูกต้อง
  queryClient.setQueriesData(
    {
      predicate: (query) => {
        const key = query.queryKey;
        return Array.isArray(key) && key[0] === 'appointments';
      }
    },
    (oldData: any) => {
      if (!oldData) return oldData;
      
      switch (operation) {
        case 'insert':
          return {
            ...oldData,
            followUp: [...(oldData.followUp || []), newAppointment]
          };
        case 'update':
          return {
            ...oldData,
            followUp: (oldData.followUp || []).map((apt: any) => 
              apt.id === newAppointment.id ? newAppointment : apt
            )
          };
        case 'delete':
          return {
            ...oldData,
            followUp: (oldData.followUp || []).filter((apt: any) => apt.id !== newAppointment.id)
          };
        default:
          return oldData;
      }
    }
  );
};

// ✅ แก้ไข Event type detection ให้รองรับ uppercase จาก Supabase
export const detectEventType = (
  table: string,
  event: string,
  payload: any
): TableChangeEvent | null => {
  // ✅ แปลง event เป็น lowercase เพื่อให้ตรงกับ SELECTIVE_INVALIDATION_MAP
  const normalizedEvent = event.toLowerCase();
  const eventType = `${table}_${normalizedEvent}` as TableChangeEvent;
  
  if (eventType in SELECTIVE_INVALIDATION_MAP) {
    return eventType;
  }
  
  return null;
};

// Performance monitoring - เก็บไว้สำหรับการ debug performance issues
export const logRealtimePerformance = (
  event: TableChangeEvent,
  startTime: number,
  queriesAffected: number
) => {
  const duration = performance.now() - startTime;
  
  // Warn if invalidation takes too long
  if (duration > 100) {
    console.warn(`⚠️ Slow realtime invalidation: ${duration.toFixed(2)}ms for ${event}`);
  }
};
