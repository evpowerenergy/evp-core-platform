import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any, env?: Record<string, string>) {
  // Initialize Supabase client with env variables
  const supabaseUrl = env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[API] Missing Supabase credentials');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Supabase configuration missing' }));
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Parse query parameters from URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const queryParams = url.searchParams;
  const id = queryParams.get('id');
  const category = queryParams.get('category');
  const is_active = queryParams.get('is_active');
  const search = queryParams.get('search');
  const dateFrom = queryParams.get('from');
  const dateTo = queryParams.get('to');
  const limit = queryParams.get('limit');

  try {
    if (req.method === 'GET') {
      // Get single product by ID
      if (id) {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, description, sku, category, unit_price, cost_price, stock_total, stock_available, is_active, created_at, updated_at')
          .eq('id', id)
          .single();

        if (error) throw error;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data }));
        return;
      }

      // Get all products with filters
      let query = supabase
        .from('products')
        .select('id, name, description, sku, category, unit_price, cost_price, stock_total, stock_available, is_active, created_at, updated_at, created_at_thai, updated_at_thai')
        .order('name');

      // Apply filters
      if (category) {
        query = query.eq('category', category);
      }

      if (is_active !== null && is_active !== undefined) {
        query = query.eq('is_active', is_active === 'true');
      } else {
        // Default to active products only
        query = query.eq('is_active', true);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
      }

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
        query = query.limit(1000);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: data || [] }));
      return;
    }

    if (req.method === 'POST') {
      // Create new product
      const body = req.body;

      if (!body.name || body.cost_price === undefined) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'name and cost_price are required' }));
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .insert([body])
        .select()
        .single();

      if (error) throw error;

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data }));
      return;
    }

    if (req.method === 'PUT') {
      // Update product
      const body = req.body;

      if (!body.id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'id is required' }));
        return;
      }

      const { id: productId, ...updateData } = body;

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data }));
      return;
    }

    if (req.method === 'DELETE') {
      // Delete product
      if (!id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'id is required' }));
        return;
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Product deleted' }));
      return;
    }

    // Method not allowed
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  } catch (error: any) {
    console.error('[API] Products Management Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
  }
}

