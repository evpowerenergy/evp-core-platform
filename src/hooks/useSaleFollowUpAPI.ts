/**
 * useSaleFollowUpAPI Hook
 * 
 * หน้าที่: จัดการติดตามการขาย (Sale Follow-up Management)
 * - ดึงรายการลูกค้าที่ต้องติดตาม
 * - เพิ่ม/แก้ไข/ยกเลิกการติดตาม
 * - ดึงสถิติการติดตาม
 * 
 * API: system-follow-up-sale-follow-up
 * 
 * ทำไมต้องแก้ไข?
 * - ใช้ API client utility แทน duplicate fetch code
 * - ลบ hardcoded SUPABASE_URL
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { createApiClient } from "@/utils/apiClient";

// Types
type CustomerService = Tables<"customer_services_with_days">;
type CustomerServiceUpdate = TablesUpdate<"customer_services">;
type CustomerServiceInsert = TablesInsert<"customer_services">;

export interface SaleFollowUpCustomer {
  id: number;
  customer_group: string;
  tel: string;
  province: string;
  district: string;
  capacity_kw: number;
  installation_date: string;
  installer_name: string;
  sale: string;
  service_visit_1: boolean;
  service_visit_2: boolean;
  service_visit_1_date: string;
  service_visit_2_date: string;
  service_visit_1_technician: string;
  service_visit_2_technician: string;
  status: string;
  // Sale follow-up fields
  sale_follow_up_required: boolean;
  sale_follow_up_date: string;
  sale_follow_up_date_thai: string;
  sale_follow_up_details: string;
  sale_follow_up_status: string;
  sale_follow_up_notes: string;
  sale_follow_up_assigned_to: number;
  sale_follow_up_created_at: string;
  sale_follow_up_updated_at: string;
  // Calculated fields (optional - will be computed if needed)
  days_since_installation?: number | null;
  days_until_service_1_due?: number | null;
  days_until_service_2_due?: number | null;
  days_after_service_complete?: number | null;
  service_status_calculated?: string | null;
  // Joined data
  assigned_sales_person?: {
    id: number;
    name: string;
  };
  // Lead tracking fields
  has_lead?: boolean;
  lead_info?: {
    id: number;
    status: string;
    operation_status: string;
    created_at: string;
    full_name: string | null;
  } | null;
  // Repeat sale fields (backward compatibility)
  has_repeat_sale?: boolean;
  repeat_sale_info?: {
    id: number;
    status: string;
    operation_status: string;
    created_at: string;
    full_name: string | null;
  } | null;
}

export interface SaleFollowUpStats {
  total_completed_services: number;
  pending_follow_up: number;
  completed_follow_up: number;
  cancelled_follow_up: number;
}

// Utility function to normalize phone numbers for comparison
// Remove spaces, dashes, and parentheses
const normalizePhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return "";
  return phone.replace(/[\s\-\(\)]/g, "").trim();
};

// Query keys
export const saleFollowUpKeys = {
  all: ["sale_follow_up"] as const,
  list: (filters?: any) => [...saleFollowUpKeys.all, "list", filters] as const,
  stats: () => [...saleFollowUpKeys.all, "stats"] as const,
  byId: (id: number) => [...saleFollowUpKeys.all, "byId", id] as const,
  detail: (id: number) => [...saleFollowUpKeys.all, "detail", id] as const,
};

// Get customers who completed service (both visits)
export const useCompletedServiceCustomersAPI = (filters?: {
  search?: string;
  province?: string;
  sale?: string;
  followUpStatus?: string;
  assignedTo?: number;
}) => {
  return useQuery({
    queryKey: saleFollowUpKeys.list(filters || {}),
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const params: Record<string, string> = {
        action: 'list'
      };
      if (filters?.search) params.search = filters.search;
      if (filters?.province) params.province = filters.province;
      if (filters?.sale) params.sale = filters.sale;
      if (filters?.followUpStatus) params.followUpStatus = filters.followUpStatus;
      if (filters?.assignedTo !== undefined) params.assignedTo = filters.assignedTo.toString();
      
      const response = await api.get<SaleFollowUpCustomer[]>('system-follow-up-sale-follow-up', params);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch completed service customers');
      }
      
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - increase to reduce unnecessary refetch
    gcTime: 1000 * 60 * 10, // Cache for 10 minutes
    refetchOnWindowFocus: false, // Disable auto refetch on window focus to prevent full page refresh
    refetchOnMount: true, // Refetch when component mounts (needed for data updates after mutations)
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: 1, // Only retry once on failure
    placeholderData: keepPreviousData, // Keep previous data while fetching new data
  });
};

// Get customer detail for sale follow-up
export const useSaleFollowUpCustomerDetailAPI = (customerId: number) => {
  return useQuery({
    queryKey: saleFollowUpKeys.detail(customerId),
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get<SaleFollowUpCustomer & { service_visits: any[] }>('system-follow-up-sale-follow-up', {
        action: 'detail',
        customerId: customerId.toString()
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch customer detail');
      }
      
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
    enabled: !!customerId && customerId > 0,
  });
};

// Get sale follow-up statistics
export const useSaleFollowUpStatsAPI = () => {
  return useQuery({
    queryKey: saleFollowUpKeys.stats(),
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get<SaleFollowUpStats>('system-follow-up-sale-follow-up', {
        action: 'stats'
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch sale follow-up stats');
      }
      
      return response.data;
    },
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  });
};

// Create or update sale follow-up
export const useCreateSaleFollowUpAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      followUpData,
    }: {
      customerId: number;
      followUpData: {
        sale_follow_up_date: string;
        sale_follow_up_details: string;
        sale_follow_up_assigned_to: number;
        sale_follow_up_status?: string;
      };
    }) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post<CustomerService>('system-follow-up-sale-follow-up', {
        action: 'create',
        customerId,
        followUpData,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create sale follow-up');
      }

      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: saleFollowUpKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customer_services"] });
    },
  });
};

// Update sale follow-up
export const useUpdateSaleFollowUpAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      followUpData,
    }: {
      customerId: number;
      followUpData: Partial<{
        sale_follow_up_date: string;
        sale_follow_up_details: string;
        sale_follow_up_assigned_to: number;
        sale_follow_up_status: string;
      }>;
    }) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post<CustomerService>('system-follow-up-sale-follow-up', {
        action: 'update',
        customerId,
        followUpData,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update sale follow-up');
      }

      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: saleFollowUpKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customer_services"] });
    },
  });
};

// Cancel sale follow-up
export const useCancelSaleFollowUpAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: number) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post<CustomerService>('system-follow-up-sale-follow-up', {
        action: 'cancel',
        customerId,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to cancel sale follow-up');
      }

      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: saleFollowUpKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customer_services"] });
    },
  });
};

// Get sales team members for assignment
export const useSalesTeamMembersAPI = () => {
  return useQuery({
    queryKey: ["sales_team_members"],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get('system-follow-up-sale-follow-up', {
        action: 'team'
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch sales team members');
      }
      
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get provinces for filtering
export const useSaleFollowUpProvincesAPI = () => {
  return useQuery({
    queryKey: ["sale_follow_up_provinces"],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get('system-follow-up-sale-follow-up', {
        action: 'provinces'
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch provinces');
      }
      
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get sales persons for filtering
export const useSaleFollowUpSalesPersonsAPI = () => {
  return useQuery({
    queryKey: ["sale_follow_up_sales_persons"],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get('system-follow-up-sale-follow-up', {
        action: 'sales'
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch sales persons');
      }
      
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Update customer service basic information
export const useUpdateCustomerServiceAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      customerData,
    }: {
      customerId: number;
      customerData: {
        customer_group?: string;
        tel?: string;
        province?: string;
        district?: string;
        capacity_kw?: number;
      };
    }) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post<CustomerService>('system-follow-up-sale-follow-up', {
        action: 'updateCustomer',
        customerId,
        customerData,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update customer service');
      }

      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: saleFollowUpKeys.detail(variables.customerId) });
      queryClient.invalidateQueries({ queryKey: saleFollowUpKeys.all });
      queryClient.invalidateQueries({ queryKey: ["customer_services"] });
    },
  });
};
