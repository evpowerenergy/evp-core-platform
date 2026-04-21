/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { action, poId, poData, items } = body;

    if (!action) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Action is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Performance monitoring
    const startTime = performance.now();

    let result: any = null;

    switch (action) {
      case 'updatePurchaseOrder':
        if (!poId || !poData) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'PO ID and PO data are required for updatePurchaseOrder action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
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
          return new Response(
            JSON.stringify({
              success: false,
              error: 'PO ID is required for deletePurchaseOrder action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
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
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid action. Supported actions: updatePurchaseOrder, deletePurchaseOrder'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
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
          action
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Purchase Order Mutations API Error:', error);
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
