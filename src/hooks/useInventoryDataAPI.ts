/**
 * useInventoryDataAPI Hook
 * 
 * หน้าที่: ดึงข้อมูลคลังสินค้าแบบรวม (Combined Inventory Data)
 * - รวมข้อมูล products, inventory units, purchase orders, suppliers, customers, sales docs
 * - เรียก API หลายตัวพร้อมกันเพื่อเพิ่มประสิทธิภาพ
 * 
 * APIs: 
 * - core-inventory-inventory (products, purchase orders, suppliers, customers, sales docs)
 * - additional-inventory-inventory-units (inventory units)
 * - core-inventory-inventory-mutations (mutations)
 * 
 * ทำไมต้องแก้ไข?
 * - ใช้ API client utility แทน duplicate fetch code
 * - ลบ hardcoded SUPABASE_URL
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./useToast";
import { createApiClient } from "@/utils/apiClient";

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
export const useInventoryDataAPI = (options?: InventoryDataOptions) => {
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
            (async () => {
              // ใช้ API client utility แทน duplicate fetch code
              const api = await createApiClient();
              
              const response = await api.get('core-inventory-inventory', {
                includeProducts: 'true',
                includeInventoryUnits: 'false',
                includePurchaseOrders: 'false',
                includeSuppliers: 'false',
                includeCustomers: 'false',
                includeSalesDocs: 'false',
                limit: limit.toString()
              });
              
              if (!response.success || !response.data) {
                return { data: [], error: response.error };
              }
              
              const data = response.data as { products?: unknown[] };
              return { data: data.products || [], error: null };
            })()
          );
        }

        // 2. Get inventory units
        if (includeInventoryUnits) {
          promises.push(
            (async () => {
              // ใช้ API client utility แทน duplicate fetch code
              const api = await createApiClient();
              
              const response = await api.get('additional-inventory-inventory-units', {
                limit: limit.toString()
              });
              
              if (!response.success) {
                return { data: [], error: response.error };
              }
              
              return { data: response.data || [], error: null };
            })()
          );
        }

        // 3. Get purchase orders
        if (includePurchaseOrders) {
          promises.push(
            (async () => {
              // ใช้ API client utility แทน duplicate fetch code
              const api = await createApiClient();
              
              const response = await api.get('core-inventory-inventory', {
                includeProducts: 'false',
                includeInventoryUnits: 'false',
                includePurchaseOrders: 'true',
                includeSuppliers: 'false',
                includeCustomers: 'false',
                includeSalesDocs: 'false',
                limit: limit.toString()
              });
              
              if (!response.success || !response.data) {
                return { data: [], error: response.error };
              }
              
              const data = response.data as { purchaseOrders?: unknown[] };
              return { data: data.purchaseOrders || [], error: null };
            })()
          );
        }

        // 4. Get suppliers
        if (includeSuppliers) {
          promises.push(
            (async () => {
              // ใช้ API client utility แทน duplicate fetch code
              const api = await createApiClient();
              
              const response = await api.get('core-inventory-inventory', {
                includeProducts: 'false',
                includeInventoryUnits: 'false',
                includePurchaseOrders: 'false',
                includeSuppliers: 'true',
                includeCustomers: 'false',
                includeSalesDocs: 'false',
                limit: limit.toString()
              });
              
              if (!response.success || !response.data) {
                return { data: [], error: response.error };
              }
              
              const data = response.data as { suppliers?: unknown[] };
              return { data: data.suppliers || [], error: null };
            })()
          );
        }

        // 5. Get customers
        if (includeCustomers) {
          promises.push(
            (async () => {
              // ใช้ API client utility แทน duplicate fetch code
              const api = await createApiClient();
              
              const response = await api.get('core-inventory-inventory', {
                includeProducts: 'false',
                includeInventoryUnits: 'false',
                includePurchaseOrders: 'false',
                includeSuppliers: 'false',
                includeCustomers: 'true',
                includeSalesDocs: 'false',
                limit: limit.toString()
              });
              
              if (!response.success || !response.data) {
                return { data: [], error: response.error };
              }
              
              const data = response.data as { customers?: unknown[] };
              return { data: data.customers || [], error: null };
            })()
          );
        }

        // 6. Get sales documents
        if (includeSalesDocs) {
          promises.push(
            (async () => {
              // ใช้ API client utility แทน duplicate fetch code
              const api = await createApiClient();
              
              const response = await api.get('core-inventory-inventory', {
                includeProducts: 'false',
                includeInventoryUnits: 'false',
                includePurchaseOrders: 'false',
                includeSuppliers: 'false',
                includeCustomers: 'false',
                includeSalesDocs: 'true',
                limit: limit.toString()
              });
              
              if (!response.success || !response.data) {
                return { data: [], error: response.error };
              }
              
              const data = response.data as { salesDocs?: unknown[] };
              return { data: data.salesDocs || [], error: null };
            })()
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
          console.warn(`🐌 Slow useInventoryDataAPI query: ${queryTime.toFixed(2)}ms`);
        }

        return result;

      } catch (error) {
        console.error('❌ Error in useInventoryDataAPI:', error);
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
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post('core-inventory-inventory-mutations', {
        action: 'addProduct',
        data: productData
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to add product');
      }
      return response.data;
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
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post('core-inventory-inventory-mutations', {
        action: 'addInventoryUnit',
        data: unitData
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to add inventory unit');
      }
      return response.data;
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
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post('core-inventory-inventory-mutations', {
        action: 'addPurchaseOrder',
        data: poData
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to add purchase order');
      }
      return response.data;
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
export const useAddInventoryUnitAPI = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unitData: any) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post('core-inventory-inventory-mutations', {
        action: 'addInventoryUnit',
        data: unitData
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to add inventory unit');
      }
      return response.data;
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
export const useProductsDataAPI = (limit: number = 100) => {
  return useQuery({
    queryKey: ['products', limit],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get('additional-products-products', {
        limit: limit.toString()
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch products');
      }
      
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Specialized hook for Inventory Units only
 */
export const useInventoryUnitsDataAPI = (limit: number = 100) => {
  return useQuery({
    queryKey: ['inventory_units', limit],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get('additional-inventory-inventory-units', {
        limit: limit.toString()
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch inventory units');
      }
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Specialized hook for Purchase Orders only
 */
export const usePurchaseOrdersDataAPI = (limit: number = 100) => {
  return useQuery({
    queryKey: ['purchase_orders', limit],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get('core-inventory-inventory', {
        includeProducts: 'false',
        includeInventoryUnits: 'false',
        includePurchaseOrders: 'true',
        includeSuppliers: 'false',
        includeCustomers: 'false',
        includeSalesDocs: 'false',
        limit: limit.toString()
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch purchase orders');
      }
      
      const data = response.data as { purchaseOrders?: unknown[] };
      return data.purchaseOrders || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 20, // 20 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook สำหรับดึงข้อมูล Purchase Order เดี่ยว
 */
export const usePurchaseOrderDetailAPI = (poId: string) => {
  return useQuery({
    queryKey: ['purchase_order', poId],
    queryFn: async () => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.get('additional-purchase-orders-purchase-orders', {
        poId: poId
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch purchase order detail');
      }
      return response.data;
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
export const useUpdatePurchaseOrderAPI = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poId, poData, items }: { poId: string, poData: any, items: any[] }) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post('additional-purchase-orders-purchase-order-mutations', {
        action: 'updatePurchaseOrder',
        poId,
        poData,
        items
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update purchase order');
      }
      return response.data;
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
export const useDeletePurchaseOrderAPI = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (poId: string) => {
      // ใช้ API client utility แทน duplicate fetch code
      const api = await createApiClient();
      
      const response = await api.post('additional-purchase-orders-purchase-order-mutations', {
        action: 'deletePurchaseOrder',
        poId
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete purchase order');
      }
      return response.data;
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