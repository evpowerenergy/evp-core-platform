
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./useToast";

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

export const useProducts = (filters?: ProductFilters, limit: number = 1000) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['products', filters, limit],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('id, name, description, sku, category, unit_price, cost_price, stock_total, stock_available, is_active, created_at, updated_at')
        .order('name')
        .limit(limit);
      
      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      } else {
        // Default to active products only
        query = query.eq('is_active', true);
      }
      
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook สำหรับเพิ่มสินค้าใหม่
export const useAddProduct = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;
      return data;
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
export const useUpdateProduct = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Product> & { id: number }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
export const useDeleteProduct = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: number) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
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
