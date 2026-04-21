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

    // Performance monitoring
    const startTime = performance.now();

    // Get inventory units data (เหมือน useInventoryUnitsData)
    let query = supabase
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

    // Apply date filter if provided (priority over limit)
    // Use created_at_thai for consistency with other APIs (or received_date for business logic)
    if (dateFrom && dateTo) {
      // Use created_at_thai for consistency, but could also use received_date if preferred
      query = query
        .gte('created_at_thai', dateFrom)
        .lte('created_at_thai', dateTo);
      // ✅ ไม่ต้อง limit เมื่อมี Date Filter - ให้ดึงข้อมูลทั้งหมดในช่วงวันที่
    } else if (limit) {
      // ⚠️ Fallback: ถ้าไม่มี Date Filter → ใช้ limit เพื่อป้องกัน
      query = query.limit(parseInt(limit));
    } else {
      // ⚠️ Safety: ถ้าไม่มีทั้ง Date Filter และ limit → ใช้ default limit
      query = query.limit(100);
    }

    const { data: inventoryUnits, error: unitsError } = await query;

    if (unitsError) {
      throw new Error(`Failed to fetch inventory units: ${unitsError.message}`);
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: inventoryUnits || [],
        meta: {
          executionTime: `${executionTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          limit: limit ? parseInt(limit) : null,
          totalUnits: inventoryUnits?.length || 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Inventory Units API Error:', error);
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
