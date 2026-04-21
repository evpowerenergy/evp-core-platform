import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any, env?: Record<string, string>) {
  // ✅ 1. Accept env parameter for Vite compatibility
  const supabaseUrl = env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Supabase configuration missing' }));
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    // ✅ 2. Parse query parameters from URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const queryParams = url.searchParams;
    const dateFrom = queryParams.get('from');
    const dateTo = queryParams.get('to');
    const limit = queryParams.get('limit');

    // Performance monitoring
    const startTime = performance.now();

    // Get products data (เหมือน useProductsData)
    let query = supabase
      .from('products')
      .select('id, name, description, sku, category, unit_price, cost_price, current_stock, supplier_id, is_active, created_at, updated_at, created_at_thai, updated_at_thai')
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
      // ⚠️ Safety: ถ้าไม่มีทั้ง Date Filter และ limit → ใช้ default limit
      query = query.limit(100);
    }

    const { data: products, error: productsError } = await query;

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // ✅ 3. Use native response API
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
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
    }));

  } catch (error: any) {
    console.error('Products API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }));
  }
}
