/**
 * Global Real-time Subscription System
 * แก้ไขปัญหา Duplicate Subscriptions และ Resource Overload
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient, QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  selectiveInvalidate, 
  detectEventType, 
  optimisticUpdateLeads, 
  optimisticUpdateAppointments,
  logRealtimePerformance,
  TableChangeEvent 
} from '@/lib/realtimeOptimization';

// Global subscription manager
class GlobalRealtimeManager {
  private static instance: GlobalRealtimeManager;
  private channels: Map<string, any> = new Map();
  private subscribers: Set<string> = new Set();
  private queryClient: QueryClient | null = null;
  private isConnected = false;

  static getInstance(): GlobalRealtimeManager {
    if (!GlobalRealtimeManager.instance) {
      GlobalRealtimeManager.instance = new GlobalRealtimeManager();
    }
    return GlobalRealtimeManager.instance;
  }

  setQueryClient(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  subscribe(userId: string) {
    if (this.subscribers.has(userId)) {
      return;
    }

    this.subscribers.add(userId);

    // Create subscriptions only if this is the first subscriber
    if (this.subscribers.size === 1) {
      this.createSubscriptions();
    }
  }

  unsubscribe(userId: string) {
    this.subscribers.delete(userId);

    // Cleanup subscriptions if no more subscribers
    if (this.subscribers.size === 0) {
      this.cleanup();
    }
  }

  private createSubscriptions() {
    if (!this.queryClient) {
      console.error('❌ QueryClient not set');
      return;
    }

    // Leads subscription
    const leadsChannel = supabase
      .channel('global-leads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          const startTime = performance.now();
          
          const eventType = detectEventType('leads', payload.eventType, payload);
          if (eventType) {
            // Try optimistic update first
            if (payload.eventType === 'INSERT' && payload.new) {
              optimisticUpdateLeads(this.queryClient!, payload.new, 'insert');
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              optimisticUpdateLeads(this.queryClient!, payload.new, 'update');
            } else if (payload.eventType === 'DELETE' && payload.old) {
              optimisticUpdateLeads(this.queryClient!, payload.old, 'delete');
            }
            
            // Then selective invalidation
            selectiveInvalidate(this.queryClient!, eventType, {
              debounceMs: 300,
              userId: (payload.new as any)?.created_by || (payload.old as any)?.created_by
            });
            
            logRealtimePerformance(eventType, startTime, 3);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
        }
      });

    // Productivity logs subscription
    const productivityLogsChannel = supabase
      .channel('global-productivity-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_productivity_logs'
        },
        (payload) => {
          const startTime = performance.now();
          
          const eventType = detectEventType('productivity_logs', payload.eventType, payload);
          if (eventType) {
            selectiveInvalidate(this.queryClient!, eventType, {
              debounceMs: 300,
              userId: (payload.new as any)?.created_by || (payload.old as any)?.created_by
            });
            
            logRealtimePerformance(eventType, startTime, 2);
          }
        }
      )
      .subscribe();

    // Appointments subscription
    const appointmentsChannel = supabase
      .channel('global-appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          const startTime = performance.now();
          
          const eventType = detectEventType('appointments', payload.eventType, payload);
          if (eventType) {
            // Try optimistic update first
            if (payload.eventType === 'INSERT' && payload.new) {
              optimisticUpdateAppointments(this.queryClient!, payload.new, 'insert');
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              optimisticUpdateAppointments(this.queryClient!, payload.new, 'update');
            } else if (payload.eventType === 'DELETE' && payload.old) {
              optimisticUpdateAppointments(this.queryClient!, payload.old, 'delete');
            }
            
            // Then selective invalidation
            selectiveInvalidate(this.queryClient!, eventType, {
              debounceMs: 300,
              userId: (payload.new as any)?.created_by || (payload.old as any)?.created_by
            });
            
            logRealtimePerformance(eventType, startTime, 1);
          }
        }
      )
      .subscribe();

    // Quotations subscription
    const quotationsChannel = supabase
      .channel('global-quotations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotations'
        },
        (payload) => {
          const startTime = performance.now();
          
          const eventType = detectEventType('quotations', payload.eventType, payload);
          if (eventType) {
            selectiveInvalidate(this.queryClient!, eventType, {
              debounceMs: 300,
              userId: (payload.new as any)?.created_by || (payload.old as any)?.created_by
            });
            
            logRealtimePerformance(eventType, startTime, 2);
          }
        }
      )
      .subscribe();

    // Sales team subscription
    const salesTeamChannel = supabase
      .channel('global-sales-team-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales_team_with_user_info'
        },
        (payload) => {
          const startTime = performance.now();
          
          const eventType = detectEventType('sales_team', payload.eventType, payload);
          if (eventType) {
            selectiveInvalidate(this.queryClient!, eventType, {
              debounceMs: 300,
              userId: (payload.new as any)?.created_by || (payload.old as any)?.created_by
            });
            
            logRealtimePerformance(eventType, startTime, 2);
          }
        }
      )
      .subscribe();

    // Store channels
    this.channels.set('leads', leadsChannel);
    this.channels.set('productivity_logs', productivityLogsChannel);
    this.channels.set('appointments', appointmentsChannel);
    this.channels.set('quotations', quotationsChannel);
    this.channels.set('sales_team', salesTeamChannel);
  }

  private cleanup() {
    this.channels.forEach((channel, name) => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error(`❌ Error removing ${name} channel:`, error);
      }
    });
    
    this.channels.clear();
    this.isConnected = false;
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  getSubscriberCount() {
    return this.subscribers.size;
  }
}

// Hook for using global realtime
export const useGlobalRealtime = (userId?: string) => {
  const queryClient = useQueryClient();
  const managerRef = useRef<GlobalRealtimeManager>();

  useEffect(() => {
    if (!userId) return;

    // Get or create manager instance
    managerRef.current = GlobalRealtimeManager.getInstance();
    managerRef.current.setQueryClient(queryClient);
    managerRef.current.subscribe(userId);

    return () => {
      if (managerRef.current && userId) {
        managerRef.current.unsubscribe(userId);
      }
    };
  }, [userId, queryClient]);

  const getConnectionStatus = useCallback(() => {
    return managerRef.current?.getConnectionStatus() || false;
  }, []);

  const getSubscriberCount = useCallback(() => {
    return managerRef.current?.getSubscriberCount() || 0;
  }, []);

  return {
    isConnected: getConnectionStatus(),
    subscriberCount: getSubscriberCount(),
  };
};
