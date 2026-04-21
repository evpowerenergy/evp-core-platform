/**
 * useProductsAPI Hook
 * 
 * หน้าที่: จัดการสินค้า (Products Management)
 * - ดึงรายการสินค้า
 * - เพิ่มสินค้าใหม่
 * - แก้ไขสินค้า
 * - ลบสินค้า
 * 
 * API: system-management-products-management
 * 
 * ทำไมต้องแก้ไข?
 * - ใช้ API client utility แทน duplicate fetch code
 * - ใช้ centralized types แทน any
 * - ลบ hardcoded SUPABASE_URL
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./useToast";
import { createApiClient } from "@/utils/apiClient";
import type { ApiResponse } from "@/types";

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unit_price?: number;
  cost_price: number;
  stock_total?: number;
  stock_available?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFilters {
  category?: string;
  is_active?: boolean;
  search?: string;
}

export const useProductsAPI = (filters?: ProductFilters, limit: number = 1000) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['products', filters, limit],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      // Build query parameters
      const params: Record<string, string> = {
        limit: limit.toString(),
      };
      if (filters?.category) params.category = filters.category;
      if (filters?.is_active !== undefined) params.is_active = filters.is_active.toString();
      if (filters?.search) params.search = filters.search;
      
      const response = await api.get<Product[]>('system-management-products-management', params);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch products');
      }
      
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook สำหรับเพิ่มสินค้าใหม่
export const useAddProductAPI = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post<Product>('system-management-products-management', productData);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to add product');
      }

      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_data'] });
      
      toast({
        title: "สำเร็จ",
        description: "เพิ่มสินค้าใหม่เรียบร้อยแล้ว",
      });
    },
    onError: (error) => {
      console.error('Error adding product:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มสินค้าได้",
        variant: "destructive",
      });
    },
  });
};

// Hook สำหรับอัปเดตสินค้า
export const useUpdateProductAPI = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Product> & { id: number }) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.put<Product>('system-management-products-management', { id, ...updateData });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update product');
      }

      return response.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_data'] });
      
      toast({
        title: "สำเร็จ",
        description: "อัปเดตสินค้าเรียบร้อยแล้ว",
      });
    },
    onError: (error) => {
      console.error('Error updating product:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตสินค้าได้",
        variant: "destructive",
      });
    },
  });
};

// Hook สำหรับลบสินค้า
export const useDeleteProductAPI = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: number) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.delete('system-management-products-management', {
        params: { id: productId.toString() }
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete product');
      }

      return productId;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_data'] });
      
      toast({
        title: "สำเร็จ",
        description: "ลบสินค้าเรียบร้อยแล้ว",
      });
    },
    onError: (error) => {
      console.error('Error deleting product:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบสินค้าได้",
        variant: "destructive",
      });
    },
  });
};
