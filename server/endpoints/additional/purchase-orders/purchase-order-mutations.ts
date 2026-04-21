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

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const { action, poId, poData, items } = req.body;

    if (!action) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Action is required'
      }));
      return;
    }

    // Performance monitoring
    const startTime = performance.now();

    let result: any = null;

    switch (action) {
      case 'updatePurchaseOrder':
        if (!poId || !poData) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'PO ID and PO data are required for updatePurchaseOrder action'
          }));
          return;
        }

        // Update purchase order (เหมือน useUpdatePurchaseOrder)
        const { data: poResult, error: poError } = await supabase
          .from('purchase_orders')
          .update(poData)
          .eq('id', poId)
          .select()
          .single();

        if (poError) {
          throw new Error(`Failed to update purchase order: ${poError.message}`);
        }

        // Delete old items
        await supabase
          .from('purchase_order_items')
          .delete()
          .eq('purchase_order_id', poId);

        // Add new items if provided
        if (items && items.length > 0) {
          const { error: itemsError } = await supabase
            .from('purchase_order_items')
            .insert(items.map((item: any) => ({
              purchase_order_id: poId,
              product_id: item.product_id,
              qty: item.qty,
              unit_price: item.unit_price,
              total_price: item.qty * item.unit_price
            })));

          if (itemsError) {
            throw new Error(`Failed to update purchase order items: ${itemsError.message}`);
          }
        }

        result = poResult;
        break;

      case 'deletePurchaseOrder':
        if (!poId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'PO ID is required for deletePurchaseOrder action'
          }));
          return;
        }

        // Delete purchase order (เหมือน useDeletePurchaseOrder)
        // Delete items first
        await supabase
          .from('purchase_order_items')
          .delete()
          .eq('purchase_order_id', poId);

        // Delete main PO
        const { error: deleteError } = await supabase
          .from('purchase_orders')
          .delete()
          .eq('id', poId);

        if (deleteError) {
          throw new Error(`Failed to delete purchase order: ${deleteError.message}`);
        }

        result = { deleted: true, poId };
        break;

      default:
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid action. Supported actions: updatePurchaseOrder, deletePurchaseOrder'
        }));
        return;
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // ✅ 2. Use native response API
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: result,
      meta: {
        executionTime: `${executionTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
        action
      }
    }));

  } catch (error: any) {
    console.error('Purchase Order Mutations API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }));
  }
}
