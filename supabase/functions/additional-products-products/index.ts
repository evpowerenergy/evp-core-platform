/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );
  }

  try {
    // Initialize Supabase client with environment variables (เหมือน API เดิม)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('[API] Missing Supabase credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'Supabase configuration missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Create Supabase client (ใช้ SERVICE_ROLE_KEY เพื่อ bypass RLS เหมือน API เดิม)
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse query parameters from URL
    const url = new URL(req.url);
    const queryParams = url.searchParams;
    const dateFrom = queryParams.get('from');
    const dateTo = queryParams.get('to');
    const limit = queryParams.get('limit');

    // Performance monitoring
    const startTime = performance.now();

    // Get products data (เหมือน useProductsData)
    // ⚠️ แก้ไข: ใช้ stock_total, stock_available แทน current_stock (เพราะ current_stock ไม่มีใน database)
    // ⚠️ แก้ไข: ลบ supplier_id (เพราะไม่มีใน products table ตาม types.ts)
    let query = supabase
      .from('products')
      .select('id, name, description, sku, category, unit_price, cost_price, stock_total, stock_available, is_active, created_at, updated_at, created_at_thai, updated_at_thai')
      .eq('is_active', true)
      .order('name');

    // Apply date filter if provided (priority over limit)
    // Use created_at_thai for consistency with other APIs
    if (dateFrom && dateTo) {
      query = query
        .gte('created_at_thai', dateFrom)
        .lte('created_at_thai', dateTo);
      // ✅ ไม่ต้อง limit เมื่อมี Date Filter - ให้ดึงข้อมูลทั้งหมดในช่วงวันที่
    } else if (limit) {
      // ⚠️ Fallback: ถ้าไม่มี Date Filter → ใช้ limit เพื่อป้องกัน
      query = query.limit(parseInt(limit));
    } else {
      // ⚠️ Safety: ถ้าไม่มีทั้ง Date Filter และ limit → ใช้ default limit (เหมือน API เดิม)
      query = query.limit(100);
    }

    const { data: products, error: productsError } = await query;

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: products || [],
        meta: {
          executionTime: `${executionTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          limit: limit ? parseInt(limit) : null,
          totalProducts: products?.length || 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Products API Error:', error);
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
