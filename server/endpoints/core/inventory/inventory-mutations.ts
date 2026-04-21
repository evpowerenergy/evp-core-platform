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
    const { action, data } = req.body;

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
      case 'addProduct':
        if (!data) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Product data is required for addProduct action'
          }));
          return;
        }

        // Add product mutation
        const { data: addProductData, error: addProductError } = await supabase
          .from('products')
          .insert([data])
          .select()
          .single();

        if (addProductError) {
          throw new Error(`Failed to add product: ${addProductError.message}`);
        }

        result = addProductData;
        break;

      case 'addInventoryUnit':
        if (!data) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Unit data is required for addInventoryUnit action'
          }));
          return;
        }

        // Add inventory unit mutation
        const { data: addUnitData, error: addUnitError } = await supabase
          .from('inventory_units')
          .insert([data])
          .select()
          .single();

        if (addUnitError) {
          throw new Error(`Failed to add inventory unit: ${addUnitError.message}`);
        }

        result = addUnitData;
        break;

      case 'addPurchaseOrder':
        if (!data) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Purchase order data is required for addPurchaseOrder action'
          }));
          return;
        }

        // Add purchase order mutation
        const { data: addPOData, error: addPOError } = await supabase
          .from('purchase_orders')
          .insert([data])
          .select()
          .single();

        if (addPOError) {
          throw new Error(`Failed to add purchase order: ${addPOError.message}`);
        }

        result = addPOData;
        break;

      default:
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid action. Supported actions: addProduct, addInventoryUnit, addPurchaseOrder'
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
    console.error('Inventory Mutations API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }));
  }
}
