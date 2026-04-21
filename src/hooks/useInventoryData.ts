import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./useToast";

// Types for the combined inventory data
export interface InventoryData {
  products: any[];
  inventoryUnits: any[];
  purchaseOrders: any[];
  suppliers: any[];
  customers: any[];
  salesDocs: any[];
}

export interface InventoryDataOptions {
  includeProducts?: boolean;
  includeInventoryUnits?: boolean;
  includePurchaseOrders?: boolean;
  includeSuppliers?: boolean;
  includeCustomers?: boolean;
  includeSalesDocs?: boolean;
  limit?: number;
}

/**
 * Centralized Inventory Data Hook - Combines multiple API calls into one
 * This prevents duplicate API calls and improves performance
 */
export const useInventoryData = (options?: InventoryDataOptions) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    includeProducts = true,
    includeInventoryUnits = true,
    includePurchaseOrders = true,
    includeSuppliers = true,
    includeCustomers = true,
    includeSalesDocs = true,
    limit = 1000
  } = options || {};

  const query = useQuery({
    queryKey: ['inventory_data', options],
    queryFn: async (): Promise<InventoryData> => {
      // เพิ่ม performance monitoring
      const startTime = performance.now();

      const result: InventoryData = {
        products: [],
        inventoryUnits: [],
        purchaseOrders: [],
        suppliers: [],
        customers: [],
        salesDocs: []
      };

      try {
        // สร้าง array ของ promises สำหรับ API calls ที่ต้องการ
        const promises: any[] = [];

        // 1. Get products
        if (includeProducts) {
          promises.push(
            Promise.resolve(supabase
              .from('products')
              .select('id, name, description, sku, category, unit_price, cost_price, stock_total, stock_available, is_active, created_at, updated_at')
              .eq('is_active', true)
              .order('name')
              .limit(limit))
          );
        }

        // 2. Get inventory units
        if (includeInventoryUnits) {
          promises.push(
            Promise.resolve(supabase
              .from('inventory_units')
              .select(`
                *,
                products:product_id (
                  name,
                  category,
                  brand,
                  model
                )
              `)
              .order('created_at', { ascending: false })
              .limit(limit))
          );
        }

        // 3. Get purchase orders
        if (includePurchaseOrders) {
          promises.push(
            supabase
              .from('purchase_orders')
              .select(`
                *,
                suppliers:supplier_id (
                  name,
                  contact_person,
                  email,
                  phone
                ),
                purchase_order_items (
                  id,
                  product_id,
                  qty,
                  unit_price,
                  total_price,
                  products:product_id (
                    name,
                    sku
                  )
                )
              `)
              .order('created_at', { ascending: false })
              .limit(limit)
          );
        }

        // 4. Get suppliers
        if (includeSuppliers) {
          promises.push(
            Promise.resolve(supabase
              .from('suppliers')
              .select('*')
              .order('name')
              .limit(limit))
          );
        }

        // 5. Get customers
        if (includeCustomers) {
          promises.push(
            Promise.resolve(supabase
              .from('customers')
              .select('id, name, tel, email, platform, status, created_at, updated_at')
              .order('name')
              .limit(limit))
          );
        }

        // 6. Get sales documents
        if (includeSalesDocs) {
          promises.push(
            Promise.resolve(supabase
              .from('sales_docs')
              .select(`
                *,
                customers:customer_id (
                  name,
                  tel,
                  email,
                  platform
                ),
                sales_doc_items (
                  id,
                  product_id,
                  qty,
                  unit_price,
                  total_price
                )
              `)
              .order('created_at', { ascending: false })
              .limit(limit))
          );
        }

        // เรียก API ทั้งหมดพร้อมกัน
        const results = await Promise.all(promises);

        // ประมวลผลผลลัพธ์
        let resultIndex = 0;

        if (includeProducts) {
          const { data: productsData, error: productsError } = results[resultIndex++];
          if (productsError) {
            console.error('❌ Error fetching products:', productsError);
          } else {
            result.products = productsData || [];
          }
        }

        if (includeInventoryUnits) {
          const { data: unitsData, error: unitsError } = results[resultIndex++];
          if (unitsError) {
            console.error('❌ Error fetching inventory units:', unitsError);
          } else {
            result.inventoryUnits = unitsData || [];
          }
        }

        if (includePurchaseOrders) {
          const { data: poData, error: poError } = results[resultIndex++];
          if (poError) {
            console.error('❌ Error fetching purchase orders:', poError);
          } else {
            result.purchaseOrders = poData || [];
          }
        }

        if (includeSuppliers) {
          const { data: suppliersData, error: suppliersError } = results[resultIndex++];
          if (suppliersError) {
            console.error('❌ Error fetching suppliers:', suppliersError);
          } else {
            result.suppliers = suppliersData || [];
          }
        }

        if (includeCustomers) {
          const { data: customersData, error: customersError } = results[resultIndex++];
          if (customersError) {
            console.error('❌ Error fetching customers:', customersError);
          } else {
            result.customers = customersData || [];
          }
        }

        if (includeSalesDocs) {
          const { data: salesData, error: salesError } = results[resultIndex++];
          if (salesError) {
            console.error('❌ Error fetching sales docs:', salesError);
          } else {
            result.salesDocs = salesData || [];
          }
        }

        const endTime = performance.now();
        const queryTime = endTime - startTime;
        
        // Log performance
        if (queryTime > 5000) {
          console.warn(`🐌 Slow useInventoryData query: ${queryTime.toFixed(2)}ms`);
        } else {

        }

        return result;

      } catch (error) {
        console.error('❌ Error in useInventoryData:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
    refetchOnWindowFocus: false,
  });

  // Optimistic mutations
  const addProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
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

  const addInventoryUnitMutation = useMutation({
    mutationFn: async (unitData: any) => {
      const { data, error } = await supabase
        .from('inventory_units')
        .insert([unitData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_data'] });
      toast({
        title: "สำเร็จ",
        description: "เพิ่มหน่วยสินค้าใหม่เรียบร้อยแล้ว",
      });
    },
    onError: (error) => {
      console.error('Error adding inventory unit:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มหน่วยสินค้าได้",
        variant: "destructive",
      });
    },
  });

  const addPurchaseOrderMutation = useMutation({
    mutationFn: async (poData: any) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert([poData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_data'] });
      toast({
        title: "สำเร็จ",
        description: "สร้าง Purchase Order ใหม่เรียบร้อยแล้ว",
      });
    },
    onError: (error) => {
      console.error('Error adding purchase order:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้าง Purchase Order ได้",
        variant: "destructive",
      });
    },
  });

  return {
    // Query data
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    
    // Mutations
    addProduct: addProductMutation.mutateAsync,
    addInventoryUnit: addInventoryUnitMutation.mutateAsync,
    addPurchaseOrder: addPurchaseOrderMutation.mutateAsync,
    
    // Loading states
    isAddingProduct: addProductMutation.isPending,
    isAddingInventoryUnit: addInventoryUnitMutation.isPending,
    isAddingPurchaseOrder: addPurchaseOrderMutation.isPending,
  };
};

/**
 * Hook สำหรับเพิ่ม Inventory Unit
 */
export const useAddInventoryUnit = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unitData: any) => {
      const { data, error } = await supabase
        .from('inventory_units')
        .insert([unitData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_data'] });
      toast({
        title: "สำเร็จ",
        description: "เพิ่มหน่วยสินค้าใหม่เรียบร้อยแล้ว",
      });
    },
    onError: (error) => {
      console.error('Error adding inventory unit:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มหน่วยสินค้าได้",
        variant: "destructive",
      });
    },
  });
};

/**
 * Specialized hook for Products only
 */
export const useProductsData = (limit: number = 100) => {
  return useQuery({
    queryKey: ['products', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, sku, category, unit_price, cost_price, current_stock, supplier_id, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('name')
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Specialized hook for Inventory Units only
 */
export const useInventoryUnitsData = (limit: number = 100) => {
  return useQuery({
    queryKey: ['inventory_units', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_units')
        .select(`
          *,
          products:product_id (
            name,
            category,
            brand,
            model
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Specialized hook for Purchase Orders only
 */
export const usePurchaseOrdersData = (limit: number = 100) => {
  return useQuery({
    queryKey: ['purchase_orders', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers:supplier_id (
            name,
            contact_person,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook สำหรับดึงข้อมูล Purchase Order เดี่ยว
 */
export const usePurchaseOrderDetail = (poId: string) => {
  return useQuery({
    queryKey: ['purchase_order', poId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers:supplier_id (
            name,
            contact_person,
            email,
            phone,
            address
          ),
          purchase_order_items:purchase_order_items (
            *,
            products:product_id (
              id,
              name,
              description,
              sku,
              category
            )
          )
        `)
        .eq('id', poId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!poId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook สำหรับอัปเดต Purchase Order
 */
export const useUpdatePurchaseOrder = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poId, poData, items }: { poId: string, poData: any, items: any[] }) => {
      // อัปเดต PO หลัก
      const { data: poResult, error: poError } = await supabase
        .from('purchase_orders')
        .update(poData)
        .eq('id', poId)
        .select()
        .single();

      if (poError) throw poError;

      // ลบ items เดิม
      await supabase
        .from('purchase_order_items')
        .delete()
        .eq('purchase_order_id', poId);

      // เพิ่ม items ใหม่
      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(items.map(item => ({
            purchase_order_id: poId,
            product_id: item.product_id,
            qty: item.qty,
            unit_price: item.unit_price,
            total_price: item.qty * item.unit_price
          })));

        if (itemsError) throw itemsError;
      }

      return poResult;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase_order', variables.poId] });
      queryClient.invalidateQueries({ queryKey: ['inventory_data'] });
      toast({
        title: "สำเร็จ",
        description: "อัปเดต Purchase Order เรียบร้อยแล้ว",
      });
    },
    onError: (error) => {
      console.error('Error updating purchase order:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดต Purchase Order ได้",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook สำหรับลบ Purchase Order
 */
export const useDeletePurchaseOrder = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (poId: string) => {
      // ลบ items ก่อน
      await supabase
        .from('purchase_order_items')
        .delete()
        .eq('purchase_order_id', poId);

      // ลบ PO หลัก
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', poId);

      if (error) throw error;
      return poId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_data'] });
      toast({
        title: "สำเร็จ",
        description: "ลบ Purchase Order เรียบร้อยแล้ว",
      });
    },
    onError: (error) => {
      console.error('Error deleting purchase order:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบ Purchase Order ได้",
        variant: "destructive",
      });
    },
  });
};
