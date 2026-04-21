/**
 * useServiceVisitsAPI Hook
 * 
 * หน้าที่: จัดการการเยี่ยมชมบริการ (Service Visits Management)
 * - ดึงรายการการเยี่ยมชมบริการ
 * - เพิ่ม/แก้ไขการเยี่ยมชมบริการ
 * 
 * API: system-service-service-visits
 * 
 * ทำไมต้องแก้ไข?
 * - ใช้ API client utility แทน duplicate fetch code
 * - ลบ hardcoded SUPABASE_URL
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tables } from "@/integrations/supabase/types";
import { createApiClient } from "@/utils/apiClient";

type CustomerService = Tables<"customer_services">;

// Query Keys
export const serviceVisitKeys = {
  all: ["service_visits"] as const,
  byCustomer: (customerId: number) => [...serviceVisitKeys.all, "customer", customerId] as const,
};

// Service visit data structure
export interface ServiceVisit {
  id: number;
  customerId: number;
  visitNumber: 1 | 2;
  visitDate: string;
  visitDateThai: string;
  technician: string;
  completed: boolean;
}

// Get service visits for a specific customer
export const useServiceVisitsAPI = (customerId: number) => {
  return useQuery({
    queryKey: serviceVisitKeys.byCustomer(customerId),
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get<ServiceVisit[]>('system-service-service-visits', {
        action: 'byCustomer',
        customerId: customerId.toString()
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch service visits');
      }

      return response.data;
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Create or update service visit
export const useCreateServiceVisitAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      customerId, 
      visitNumber, 
      visitDate, 
      technician, 
    }: { 
      customerId: number; 
      visitNumber: 1 | 2; 
      visitDate: string; 
      technician: string; 
    }) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post<CustomerService>('system-service-service-visits', {
        customerId,
        visitNumber,
        visitDate,
        technician,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create service visit');
      }

      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch customer services
      queryClient.invalidateQueries({ queryKey: ["customer_services"] });
      queryClient.invalidateQueries({ queryKey: serviceVisitKeys.byCustomer(data.id) });
    },
  });
};

// Update service visit
export const useUpdateServiceVisitAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      customerId, 
      visitNumber, 
      visitDate, 
      technician, 
    }: { 
      customerId: number; 
      visitNumber: 1 | 2; 
      visitDate: string; 
      technician: string; 
    }) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.put<CustomerService>('system-service-service-visits', {
        customerId,
        visitNumber,
        visitDate,
        technician,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update service visit');
      }

      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch customer services
      queryClient.invalidateQueries({ queryKey: ["customer_services"] });
      queryClient.invalidateQueries({ queryKey: serviceVisitKeys.byCustomer(data.id) });
    },
  });
};

// Cancel service visit
export const useCancelServiceVisitAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      customerId, 
      visitNumber 
    }: { 
      customerId: number; 
      visitNumber: 1 | 2; 
    }) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.delete<CustomerService>('system-service-service-visits', {
        params: {
          customerId: customerId.toString(),
          visitNumber: visitNumber.toString()
        }
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to cancel service visit');
      }

      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch customer services
      queryClient.invalidateQueries({ queryKey: ["customer_services"] });
      queryClient.invalidateQueries({ queryKey: serviceVisitKeys.byCustomer(data.id) });
    },
  });
};

// Get upcoming service visits (next 7 days)
export const useUpcomingServiceVisitsAPI = () => {
  return useQuery({
    queryKey: [...serviceVisitKeys.all, "upcoming"],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get<Array<{
        id: number;
        customerGroup: string;
        tel: string;
        province: string;
        district: string | null;
        pendingVisit1: boolean;
        pendingVisit2: boolean;
        installationDate: string | null;
      }>>('system-service-service-visits', {
        action: 'upcoming'
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch upcoming service visits');
      }

      return response.data;
    },
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
};
