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
    const dateFrom = queryParams.get('from');
    const dateTo = queryParams.get('to');
    const limit = queryParams.get('limit');
    const poId = queryParams.get('poId');

    // Performance monitoring
    const startTime = performance.now();

    let result: any = null;

    if (poId) {
      // Get single purchase order detail (เหมือน usePurchaseOrderDetail)
      const { data: purchaseOrder, error: poError } = await supabase
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
        .maybeSingle();

      if (poError) {
        throw new Error(`Failed to fetch purchase order: ${poError.message}`);
      }

      if (!purchaseOrder) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Purchase order not found'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404
          }
        );
      }

      result = purchaseOrder;
    } else {
      // Get purchase orders list (เหมือน usePurchaseOrdersData)
      let query = supabase
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
        .order('created_at', { ascending: false });

      // Apply date filter if provided (priority over limit)
      // Use po_date (business date) for filtering, or created_at if po_date filtering doesn't work
      if (dateFrom && dateTo) {
        // Try po_date first (business date)
        query = query
          .gte('po_date', dateFrom.split('T')[0]) // Extract date part only
          .lte('po_date', dateTo.split('T')[0]);
        // ✅ ไม่ต้อง limit เมื่อมี Date Filter - ให้ดึงข้อมูลทั้งหมดในช่วงวันที่
      } else if (limit) {
        // ⚠️ Fallback: ถ้าไม่มี Date Filter → ใช้ limit เพื่อป้องกัน
        query = query.limit(parseInt(limit));
      } else {
        // ⚠️ Safety: ถ้าไม่มีทั้ง Date Filter และ limit → ใช้ default limit
        query = query.limit(100);
      }

      const { data: purchaseOrders, error: poError } = await query;

      if (poError) {
        throw new Error(`Failed to fetch purchase orders: ${poError.message}`);
      }

      result = purchaseOrders || [];
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        meta: {
          executionTime: `${executionTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          limit: limit ? parseInt(limit) : null,
          poId: poId || null,
          isDetail: !!poId,
          totalPOs: Array.isArray(result) ? result.length : 1
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Purchase Orders API Error:', error);
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
