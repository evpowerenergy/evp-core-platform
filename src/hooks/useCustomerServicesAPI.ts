/**
 * useCustomerServicesAPI Hook
 * 
 * หน้าที่: จัดการบริการลูกค้า (Customer Services Management)
 * - ดึงรายการบริการลูกค้า
 * - เพิ่ม/แก้ไข/ลบบริการลูกค้า
 * - ดึงสถิติบริการลูกค้า
 * 
 * API: additional-customer-customer-services, additional-customer-customer-service-mutations, additional-customer-customer-service-stats
 * 
 * ทำไมต้องแก้ไข?
 * - ใช้ API client utility แทน duplicate fetch code
 * - ลบ hardcoded SUPABASE_URL
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { createApiClient } from "@/utils/apiClient";
import { saleFollowUpKeys } from "./useSaleFollowUpAPI";

type CustomerService = Tables<"customer_services_extended">;
type CustomerServiceInsert = TablesInsert<"customer_services">;
type CustomerServiceUpdate = TablesUpdate<"customer_services">;

// Query Keys
export const customerServiceKeys = {
  all: ["customer_services"] as const,
  lists: () => [...customerServiceKeys.all, "list"] as const,
  list: (filters: Record<string, any>) => [...customerServiceKeys.lists(), { filters }] as const,
  details: () => [...customerServiceKeys.all, "detail"] as const,
  detail: (id: number) => [...customerServiceKeys.details(), id] as const,
  stats: () => [...customerServiceKeys.all, "stats"] as const,
};

// Get all customer services with optional filters
export const useCustomerServicesAPI = (filters?: {
  search?: string;
  province?: string;
  sale?: string;
  installerName?: string;
  serviceVisit1?: boolean;
  serviceVisit2?: boolean;
  serviceVisit3?: boolean;
  serviceVisit4?: boolean;
  serviceVisit5?: boolean;
}) => {
  return useQuery({
    queryKey: customerServiceKeys.list(filters || {}),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.province && filters.province !== 'all') params.append('province', filters.province);
      if (filters?.sale && filters.sale !== 'all') params.append('sale', filters.sale);
      if (filters?.installerName && filters.installerName !== 'all') params.append('installerName', filters.installerName);
      if (filters?.serviceVisit1 !== undefined) params.append('serviceVisit1', filters.serviceVisit1.toString());
      if (filters?.serviceVisit2 !== undefined) params.append('serviceVisit2', filters.serviceVisit2.toString());
      if (filters?.serviceVisit3 !== undefined) params.append('serviceVisit3', filters.serviceVisit3.toString());
      if (filters?.serviceVisit4 !== undefined) params.append('serviceVisit4', filters.serviceVisit4.toString());
      if (filters?.serviceVisit5 !== undefined) params.append('serviceVisit5', filters.serviceVisit5.toString());

      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const paramsObj: Record<string, string> = {};
      if (filters?.search) paramsObj.search = filters.search;
      if (filters?.province && filters.province !== 'all') paramsObj.province = filters.province;
      if (filters?.sale && filters.sale !== 'all') paramsObj.sale = filters.sale;
      if (filters?.installerName && filters.installerName !== 'all') paramsObj.installerName = filters.installerName;
      if (filters?.serviceVisit1 !== undefined) paramsObj.serviceVisit1 = filters.serviceVisit1.toString();
      if (filters?.serviceVisit2 !== undefined) paramsObj.serviceVisit2 = filters.serviceVisit2.toString();
      if (filters?.serviceVisit3 !== undefined) paramsObj.serviceVisit3 = filters.serviceVisit3.toString();
      if (filters?.serviceVisit4 !== undefined) paramsObj.serviceVisit4 = filters.serviceVisit4.toString();
      if (filters?.serviceVisit5 !== undefined) paramsObj.serviceVisit5 = filters.serviceVisit5.toString();
      
      const response = await api.get<CustomerService[]>('additional-customer-customer-services', paramsObj);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch customer services');
      }
      return response.data;
    },
    staleTime: 0, // Always refetch for real-time search
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
};

// Get single customer service by ID
export const useCustomerServiceAPI = (id: number) => {
  return useQuery({
    queryKey: customerServiceKeys.detail(id),
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get<CustomerService>('additional-customer-customer-services', {
        id: id.toString()
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch customer service');
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Get customer service statistics
export const useCustomerServiceStatsAPI = () => {
  return useQuery({
    queryKey: customerServiceKeys.stats(),
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get('additional-customer-customer-service-stats');
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch customer service stats');
      }
      return response.data;
    },
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
};

// Create new customer service
export const useCreateCustomerServiceAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CustomerServiceInsert) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post<CustomerService>('additional-customer-customer-service-mutations', {
        action: 'createCustomerService',
        data
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create customer service');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch customer services
      queryClient.invalidateQueries({ queryKey: customerServiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerServiceKeys.stats() });
    },
  });
};

// Update customer service
export const useUpdateCustomerServiceAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CustomerServiceUpdate }) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post<CustomerService>('additional-customer-customer-service-mutations', {
        action: 'updateCustomerService',
        id,
        data: { ...data, updated_at: new Date().toISOString() }
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update customer service');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch customer services
      queryClient.invalidateQueries({ queryKey: customerServiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerServiceKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: customerServiceKeys.stats() });
      // Invalidate sale follow up queries to refresh the list page
      // This will invalidate all sale follow up queries including the management page
      queryClient.invalidateQueries({ queryKey: saleFollowUpKeys.all });
      queryClient.invalidateQueries({ queryKey: saleFollowUpKeys.list() });
      queryClient.invalidateQueries({ queryKey: saleFollowUpKeys.stats() });
      queryClient.invalidateQueries({ queryKey: saleFollowUpKeys.detail(data.id) });
    },
  });
};

// Delete customer service
export const useDeleteCustomerServiceAPI = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post('additional-customer-customer-service-mutations', {
        action: 'deleteCustomerService',
        id
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete customer service');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch customer services
      queryClient.invalidateQueries({ queryKey: customerServiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerServiceKeys.stats() });
    },
  });
};

// Get unique provinces for filter dropdown
export const useCustomerServiceProvincesAPI = () => {
  return useQuery({
    queryKey: [...customerServiceKeys.all, "provinces"],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get('additional-customer-customer-service-filters', {
        filterType: 'provinces'
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch provinces');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Get unique installer names for filter dropdown
export const useCustomerServiceInstallersAPI = () => {
  return useQuery({
    queryKey: [...customerServiceKeys.all, "installers"],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get('additional-customer-customer-service-filters', {
        filterType: 'installers'
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch installers');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Get unique sales teams for filter dropdown
export const useCustomerServiceSalesAPI = () => {
  return useQuery({
    queryKey: [...customerServiceKeys.all, "sales"],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get('additional-customer-customer-service-filters', {
        filterType: 'sales'
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch sales');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Get unique technicians for filter dropdown
export const useCustomerServiceTechniciansAPI = () => {
  return useQuery({
    queryKey: [...customerServiceKeys.all, "technicians"],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get('additional-customer-customer-service-filters', {
        filterType: 'technicians'
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch technicians');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};