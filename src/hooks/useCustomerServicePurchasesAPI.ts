/**
 * useCustomerServicePurchasesAPI Hook
 * 
 * หน้าที่: จัดการการซื้อบริการลูกค้า (Customer Service Purchases Management)
 * - ดึงรายการการซื้อบริการ
 * - เพิ่ม/แก้ไข/ลบการซื้อบริการ
 * 
 * API: additional-customer-customer-service-mutations
 * Database: customer_service_purchases table (direct query)
 * 
 * ทำไมต้องแก้ไข?
 * - ใช้ API client utility แทน duplicate fetch code สำหรับ mutations
 * - ลบ hardcoded SUPABASE_URL
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createApiClient } from "@/utils/apiClient";

export interface CustomerServicePurchase {
  id: number;
  customer_service_id: number;
  service_package_type: '1_year' | '3_year' | '5_year';
  purchase_date: string;
  purchase_date_thai: string | null;
  status: 'active' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string | null;
  created_at_thai: string | null;
  updated_at: string | null;
  updated_at_thai: string | null;
}

export interface CustomerServicePurchaseInsert {
  customer_service_id: number;
  service_package_type: '1_year' | '3_year' | '5_year';
  purchase_date: string;
  purchase_date_thai?: string | null;
  status?: 'active' | 'completed' | 'cancelled';
  notes?: string | null;
}

export interface CustomerServicePurchaseUpdate {
  service_package_type?: '1_year' | '3_year' | '5_year';
  purchase_date?: string;
  purchase_date_thai?: string | null;
  status?: 'active' | 'completed' | 'cancelled';
  notes?: string | null;
}

// Query Keys
export const customerServicePurchaseKeys = {
  all: ["customer_service_purchases"] as const,
  byCustomerService: (customerServiceId: number) => 
    [...customerServicePurchaseKeys.all, "byCustomerService", customerServiceId] as const,
};

// Get purchases by customer service ID
export const useCustomerServicePurchases = (customerServiceId: number) => {
  return useQuery({
    queryKey: customerServicePurchaseKeys.byCustomerService(customerServiceId),
    queryFn: async () => {
      // Use Edge Function instead of direct Supabase query to avoid type issues
      const api = await createApiClient();
      
      const response = await api.get<CustomerServicePurchase[]>('additional-customer-customer-service-purchases', {
        customerServiceId: customerServiceId.toString()
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch customer service purchases');
      }

      return response.data;
    },
    enabled: !!customerServiceId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Create new purchase
export const useCreateCustomerServicePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CustomerServicePurchaseInsert) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post<CustomerServicePurchase>('additional-customer-customer-service-mutations', {
        action: 'createCustomerServicePurchase',
        data
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create customer service purchase');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ 
        queryKey: customerServicePurchaseKeys.byCustomerService(data.customer_service_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["customer_services"] 
      });
    },
  });
};

// Update purchase
export const useUpdateCustomerServicePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CustomerServicePurchaseUpdate }) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post<CustomerServicePurchase>('additional-customer-customer-service-mutations', {
        action: 'updateCustomerServicePurchase',
        id,
        data: { ...data, updated_at: new Date().toISOString() }
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update customer service purchase');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ 
        queryKey: customerServicePurchaseKeys.byCustomerService(data.customer_service_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["customer_services"] 
      });
    },
  });
};

// Delete purchase
export const useDeleteCustomerServicePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post('additional-customer-customer-service-mutations', {
        action: 'deleteCustomerServicePurchase',
        id
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete customer service purchase');
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate queries - we need to get customer_service_id from the deleted record
      queryClient.invalidateQueries({ 
        queryKey: customerServicePurchaseKeys.all 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["customer_services"] 
      });
    },
  });
};

// Helper function to get package type display name
export const getPackageTypeDisplayName = (type: '1_year' | '3_year' | '5_year'): string => {
  switch (type) {
    case '1_year':
      return '1 ปี (Service 1 ครั้ง)';
    case '3_year':
      return '3 ปี (Service 3 ครั้ง)';
    case '5_year':
      return '5 ปี (Service 5 ครั้ง)';
    default:
      return type;
  }
};

// Helper function to get status display name
export const getStatusDisplayName = (status: 'active' | 'completed' | 'cancelled'): string => {
  switch (status) {
    case 'active':
      return 'กำลังใช้งาน';
    case 'completed':
      return 'เสร็จสิ้น';
    case 'cancelled':
      return 'ยกเลิก';
    default:
      return status;
  }
};

