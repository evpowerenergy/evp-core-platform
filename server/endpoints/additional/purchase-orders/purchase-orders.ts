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
        .single();

      if (poError) {
        throw new Error(`Failed to fetch purchase order: ${poError.message}`);
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

    // ✅ 3. Use native response API
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
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
    }));

  } catch (error: any) {
    console.error('Purchase Orders API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }));
  }
}
