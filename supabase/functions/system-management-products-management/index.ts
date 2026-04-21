/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// API สำหรับจัดการ Products (เหมือน API เดิม - logic ตรงกัน)
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

  try {
    // Initialize Supabase client with environment variables (เหมือน API เดิม)
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

    // Parse query parameters from URL (เหมือน API เดิม)
    const url = new URL(req.url);
    const queryParams = url.searchParams;
    const id = queryParams.get('id');
    const category = queryParams.get('category');
    const is_active = queryParams.get('is_active');
    const search = queryParams.get('search');
    const dateFrom = queryParams.get('from');
    const dateTo = queryParams.get('to');
    const limit = queryParams.get('limit');

    if (req.method === 'GET') {
      // Get single product by ID (เหมือน API เดิม - logic ตรงกัน)
      if (id) {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, description, sku, category, unit_price, cost_price, stock_total, stock_available, is_active, created_at, updated_at')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          return new Response(
            JSON.stringify({ success: false, error: 'Product not found' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404
            }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // Get all products with filters (เหมือน API เดิม - logic ตรงกันทุก filter)
      let query = supabase
        .from('products')
        .select('id, name, description, sku, category, unit_price, cost_price, stock_total, stock_available, is_active, created_at, updated_at, created_at_thai, updated_at_thai')
        .order('name');

      // Apply filters (เหมือน API เดิม - logic ตรงกัน)
      if (category) {
        query = query.eq('category', category);
      }

      if (is_active !== null && is_active !== undefined) {
        query = query.eq('is_active', is_active === 'true');
      } else {
        // Default to active products only (เหมือน API เดิม)
        query = query.eq('is_active', true);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      // Apply date filter if provided (priority over limit) (เหมือน API เดิม - logic ตรงกัน)
      // Use created_at_thai for consistency with other APIs (เหมือน API เดิม)
      if (dateFrom && dateTo) {
        query = query
          .gte('created_at_thai', dateFrom)
          .lte('created_at_thai', dateTo);
        // ✅ ไม่ต้อง limit เมื่อมี Date Filter - ให้ดึงข้อมูลทั้งหมดในช่วงวันที่ (เหมือน API เดิม)
      } else if (limit) {
        // ⚠️ Fallback: ถ้าไม่มี Date Filter → ใช้ limit เพื่อป้องกัน (เหมือน API เดิม)
        query = query.limit(parseInt(limit));
      } else {
        // ⚠️ Safety: ถ้าไม่มีทั้ง Date Filter และ limit → ใช้ default limit (เหมือน API เดิม)
        query = query.limit(1000);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, data: data || [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    if (req.method === 'POST') {
      // Create new product (เหมือน API เดิม - logic ตรงกัน)
      const body = await req.json();

      if (!body.name || body.cost_price === undefined) {
        return new Response(
          JSON.stringify({ error: 'name and cost_price are required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      const { data, error } = await supabase
        .from('products')
        .insert([body])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201
        }
      );
    }

    if (req.method === 'PUT') {
      // Update product (เหมือน API เดิม - logic ตรงกัน)
      const body = await req.json();

      if (!body.id) {
        return new Response(
          JSON.stringify({ error: 'id is required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      const { id: productId, ...updateData } = body;

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    if (req.method === 'DELETE') {
      // Delete product (เหมือน API เดิม - logic ตรงกัน)
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'id is required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Product deleted' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );
  } catch (error: any) {
    console.error('[API] Products Management Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
