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
    const { action, id, data } = req.body;

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
      case 'createCustomerService':
        if (!data) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Data is required for createCustomerService action'
          }));
          return;
        }

        // Create customer service (เหมือน useCreateCustomerService)
        const { data: createResult, error: createError } = await supabase
          .from("customer_services")
          .insert(data)
          .select();

        if (createError) {
          throw new Error(`Failed to create customer service: ${createError.message}`);
        }

        result = createResult?.[0];
        break;

      case 'updateCustomerService':
        if (!id || !data) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'ID and data are required for updateCustomerService action'
          }));
          return;
        }

        // Update customer service (เหมือน useUpdateCustomerService)
        const { data: updateResult, error: updateError } = await supabase
          .from("customer_services")
          .update(data)
          .eq("id", id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update customer service: ${updateError.message}`);
        }

        result = updateResult;
        break;

      case 'deleteCustomerService':
        if (!id) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'ID is required for deleteCustomerService action'
          }));
          return;
        }

        // Delete customer service (เหมือน useDeleteCustomerService)
        const { error: deleteError } = await supabase
          .from("customer_services")
          .delete()
          .eq("id", id);

        if (deleteError) {
          throw new Error(`Failed to delete customer service: ${deleteError.message}`);
        }

        result = { deleted: true, id };
        break;

      default:
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid action. Supported actions: createCustomerService, updateCustomerService, deleteCustomerService'
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
    console.error('Customer Service Mutations API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }));
  }
}