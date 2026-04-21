import { supabase } from '@/integrations/supabase/client';

// Type definitions based on actual database schema
interface Product {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unit_price?: number;
  cost_price: number;
  current_stock?: number;
  supplier_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  po_date: string;           // ← เปลี่ยนจาก order_date เป็น po_date
  expected_delivery_date?: string;
  total_amount?: number;
  note?: string;             // ← เพิ่ม note field
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  created_at_thai?: string;
  updated_at_thai?: string;
}

interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: number;
  qty: number;               // ← เปลี่ยนจาก quantity เป็น qty
  unit_price: number;
  total_price: number;
  created_at?: string;
}

interface SalesDoc {
  id: string;
  doc_number: string;        // ← เปลี่ยนจาก invoice_number เป็น doc_number
  doc_type: "QT" | "BL" | "INV";  // ← เพิ่ม doc_type field
  customer_id: string;       // ← เปลี่ยนจาก customer_name เป็น customer_id
  salesperson_id: string;    // ← เปลี่ยนจาก salesperson เป็น salesperson_id
  doc_date: string;          // ← เปลี่ยนจาก sale_date เป็น doc_date
  total_amount?: number;
  note?: string;             // ← เปลี่ยนจาก notes เป็น note
  created_at?: string;
  updated_at?: string;
}

interface SalesDocItem {
  id: string;
  sales_doc_id: string;
  product_id: number;
  qty: number;               // ← เปลี่ยนจาก quantity เป็น qty
  unit_price: number;
  total_price: number;
  created_at?: string;
}

interface Customer {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_id?: string;
  total_orders?: number;
  total_amount?: number;
  primary_salesperson?: string;
  created_at?: string;
  updated_at?: string;
}

// Products
export const inventoryAPI = {
  // Products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: number): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getProductById(id: number): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplier)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteSupplier(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getSupplierById(id: string): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Purchase Orders
  async getPurchaseOrders(): Promise<(PurchaseOrder & { supplier?: Pick<Supplier, 'name'>, items?: PurchaseOrderItem[] })[]> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(name),
        items:purchase_order_items(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createPurchaseOrder(po: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .insert(po)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deletePurchaseOrder(id: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async createPurchaseOrderItem(item: Omit<PurchaseOrderItem, 'id' | 'created_at'>): Promise<PurchaseOrderItem> {
    const { data, error } = await supabase
      .from('purchase_order_items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async createInventoryUnit(unit: { product_id: number; purchase_order_item_id: string; serial_no: string; status: 'in_stock' | 'reserved' | 'sold' | 'returned' | 'damaged' }): Promise<any> {
    const { data, error } = await supabase
      .from('inventory_units')
      .insert(unit)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder & { supplier?: Supplier, items?: PurchaseOrderItem[] }> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(*),
        items:purchase_order_items(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Sales Orders
  async getSalesOrders(): Promise<(SalesDoc & { items?: SalesDocItem[] })[]> {
    const { data, error } = await supabase
      .from('sales_docs')
      .select(`
        *,
        items:sales_doc_items(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createSalesOrder(order: Omit<SalesDoc, 'id'>): Promise<SalesDoc> {
    const { data, error } = await supabase
      .from('sales_docs')
      .insert(order)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateSalesOrder(id: string, updates: Partial<SalesDoc>): Promise<SalesDoc> {
    const { data, error } = await supabase
      .from('sales_docs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteSalesOrder(id: string): Promise<void> {
    const { error } = await supabase
      .from('sales_docs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getSalesOrderById(id: string): Promise<SalesDoc & { items?: SalesDocItem[] }> {
    const { data, error } = await supabase
      .from('sales_docs')
      .select(`
        *,
        items:sales_doc_items(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createSalesDocItem(item: Omit<SalesDocItem, 'id' | 'created_at'>): Promise<SalesDocItem> {
    const { data, error } = await supabase
      .from('sales_doc_items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    // ดึงข้อมูลลูกค้าพร้อมกับข้อมูลเซลล์ที่ขายและสถิติการขาย
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (customersError) throw customersError;

    // ดึงข้อมูล sales docs เพื่อหาสถิติและเซลล์ที่ขาย
    const { data: salesDocs, error: salesError } = await supabase
      .from('sales_docs')
      .select(`
        customer_id,
        salesperson_id,
        total_amount
      `);
    
    if (salesError) throw salesError;

    // ดึงข้อมูล sales team เพื่อหาชื่อเซลล์
    const { data: salesTeam, error: teamError } = await supabase
      .from('sales_team_with_user_info')
      .select('user_id, name');
    
    if (teamError) throw teamError;

    // สร้าง map สำหรับ sales team
    const salesTeamMap = new Map(salesTeam?.map(s => [s.user_id?.toString(), s.name]) || []);

    // คำนวณสถิติและหาเซลล์ที่ขายให้ลูกค้าแต่ละคน
    const customersWithStats = customers?.map(customer => {
      const customerSales = salesDocs?.filter(sale => sale.customer_id === customer.id) || [];
      const totalAmount = customerSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      const totalOrders = customerSales.length;
      
      // หาเซลล์ที่ขายให้ลูกค้าคนนี้มากที่สุด (หรือล่าสุด)
      const latestSale = customerSales[0]; // Get the first sale since we don't have created_at field
      
      const primarySalesperson = latestSale ? salesTeamMap.get(latestSale.salesperson_id?.toString()) : null;

      return {
        ...customer,
        total_orders: totalOrders,
        total_amount: totalAmount,
        primary_salesperson: primarySalesperson || 'ไม่ระบุ'
      };
    }) || [];

    return customersWithStats;
  },

  async createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getCustomerById(id: string): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
};
