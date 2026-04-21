/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    // Initialize Supabase client with environment variables (เหมือน API เดิม - ใช้ SERVICE_ROLE_KEY)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('[API] Missing Supabase credentials');
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405
        }
      );
    }

    // Parse query parameters from URL
    const url = new URL(req.url);
    const queryParams = url.searchParams;
    
    const includeProducts = queryParams.get('includeProducts') || 'true';
    const includeInventoryUnits = queryParams.get('includeInventoryUnits') || 'true';
    const includePurchaseOrders = queryParams.get('includePurchaseOrders') || 'true';
    const includeSuppliers = queryParams.get('includeSuppliers') || 'true';
    const includeCustomers = queryParams.get('includeCustomers') || 'true';
    const includeSalesDocs = queryParams.get('includeSalesDocs') || 'true';
    const dateFrom = queryParams.get('from');
    const dateTo = queryParams.get('to');
    const limit = queryParams.get('limit');

    const result: any = {
      products: [],
      inventoryUnits: [],
      purchaseOrders: [],
      suppliers: [],
      customers: [],
      salesDocs: []
    };

    // Performance monitoring
    const startTime = performance.now();

    // Create array of promises for API calls
    const promises: Promise<any>[] = [];

    // Helper function to apply date filter and limit
    const applyDateFilterAndLimit = (query: any, dateField: string) => {
      if (dateFrom && dateTo) {
        query = query
          .gte(dateField, dateFrom)
          .lte(dateField, dateTo);
        // ✅ ไม่ต้อง limit เมื่อมี Date Filter - ให้ดึงข้อมูลทั้งหมดในช่วงวันที่
        return query;
      } else if (limit) {
        // ⚠️ Fallback: ถ้าไม่มี Date Filter → ใช้ limit เพื่อป้องกัน
        return query.limit(parseInt(limit));
      } else {
        // ⚠️ Safety: ถ้าไม่มีทั้ง Date Filter และ limit → ใช้ default limit
        return query.limit(1000);
      }
    };

    if (includeProducts === 'true') {
      let productsQuery = supabase
        .from('products')
        .select('id, name, description, sku, category, unit_price, cost_price, stock_total, stock_available, is_active, created_at, updated_at, created_at_thai')
        .eq('is_active', true) // ✅ เพิ่ม filter เหมือน hook เดิม
        .order('name');
      
      productsQuery = applyDateFilterAndLimit(productsQuery, 'created_at_thai');
      promises.push(productsQuery);
    }

    if (includeInventoryUnits === 'true') {
      let inventoryUnitsQuery = supabase
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
        .order('created_at', { ascending: false });
      
      inventoryUnitsQuery = applyDateFilterAndLimit(inventoryUnitsQuery, 'created_at_thai');
      promises.push(inventoryUnitsQuery);
    }

    if (includePurchaseOrders === 'true') {
      let purchaseOrdersQuery = supabase
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
        .order('created_at', { ascending: false });
      
      // Use po_date (business date) for purchase orders if available, otherwise created_at_thai
      if (dateFrom && dateTo) {
        // Try po_date first (business date)
        purchaseOrdersQuery = purchaseOrdersQuery
          .gte('po_date', dateFrom.split('T')[0]) // Extract date part only
          .lte('po_date', dateTo.split('T')[0]);
      } else if (limit) {
        purchaseOrdersQuery = purchaseOrdersQuery.limit(parseInt(limit));
      } else {
        purchaseOrdersQuery = purchaseOrdersQuery.limit(1000);
      }
      
      promises.push(purchaseOrdersQuery);
    }

    if (includeSuppliers === 'true') {
      let suppliersQuery = supabase
        .from('suppliers')
        .select('*')
        .order('name');
      
      suppliersQuery = applyDateFilterAndLimit(suppliersQuery, 'created_at_thai');
      promises.push(suppliersQuery);
    }

    if (includeCustomers === 'true') {
      let customersQuery = supabase
        .from('customers')
        .select('id, name, tel, email, platform, status, created_at, updated_at')
        .order('name');
      
      // customers table may not have created_at_thai, use created_at
      if (dateFrom && dateTo) {
        customersQuery = customersQuery
          .gte('created_at', dateFrom)
          .lte('created_at', dateTo);
      } else if (limit) {
        customersQuery = customersQuery.limit(parseInt(limit));
      } else {
        customersQuery = customersQuery.limit(1000);
      }
      
      promises.push(customersQuery);
    }

    if (includeSalesDocs === 'true') {
      let salesDocsQuery = supabase
        .from('sales_docs')
        .select(`
          *,
          customers:customer_id (
            name,
            tel,
            email,
            platform
          )
        `)
        .order('created_at', { ascending: false });
      
      // sales_docs may use doc_date (business date) or created_at
      if (dateFrom && dateTo) {
        // Try doc_date first (business date), fallback to created_at
        salesDocsQuery = salesDocsQuery
          .gte('doc_date', dateFrom.split('T')[0]) // Extract date part only
          .lte('doc_date', dateTo.split('T')[0]);
      } else if (limit) {
        salesDocsQuery = salesDocsQuery.limit(parseInt(limit));
      } else {
        salesDocsQuery = salesDocsQuery.limit(1000);
      }
      
      promises.push(salesDocsQuery);
    }

    // Execute all queries in parallel
    const results = await Promise.all(promises);

    // Process results
    let resultIndex = 0;
    
    if (includeProducts === 'true') {
      const { data: products, error: productsError } = results[resultIndex++];
      if (productsError) throw productsError;
      result.products = products || [];
    }

    if (includeInventoryUnits === 'true') {
      const { data: inventoryUnits, error: inventoryUnitsError } = results[resultIndex++];
      if (inventoryUnitsError) throw inventoryUnitsError;
      result.inventoryUnits = inventoryUnits || [];
    }

    if (includePurchaseOrders === 'true') {
      const { data: purchaseOrders, error: purchaseOrdersError } = results[resultIndex++];
      if (purchaseOrdersError) throw purchaseOrdersError;
      result.purchaseOrders = purchaseOrders || [];
    }

    if (includeSuppliers === 'true') {
      const { data: suppliers, error: suppliersError } = results[resultIndex++];
      if (suppliersError) throw suppliersError;
      result.suppliers = suppliers || [];
    }

    if (includeCustomers === 'true') {
      const { data: customers, error: customersError } = results[resultIndex++];
      if (customersError) throw customersError;
      result.customers = customers || [];
    }

    if (includeSalesDocs === 'true') {
      const { data: salesDocs, error: salesDocsError } = results[resultIndex++];
      if (salesDocsError) throw salesDocsError;
      result.salesDocs = salesDocs || [];
    }

    // Calculate statistics
    const stats = {
      totalProducts: result.products.length,
      activeProducts: result.products.filter((p: any) => p.is_active).length,
      totalSuppliers: result.suppliers.length,
      totalCustomers: result.customers.length,
      totalPurchaseOrders: result.purchaseOrders.length,
      totalSalesDocs: result.salesDocs.length,
      totalInventoryUnits: result.inventoryUnits.length
    };

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        stats,
        meta: {
          executionTime: `${executionTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          limit: limit ? parseInt(limit) : null,
          includeProducts: includeProducts === 'true',
          includeInventoryUnits: includeInventoryUnits === 'true',
          includePurchaseOrders: includePurchaseOrders === 'true',
          includeSuppliers: includeSuppliers === 'true',
          includeCustomers: includeCustomers === 'true',
          includeSalesDocs: includeSalesDocs === 'true'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Inventory API Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
