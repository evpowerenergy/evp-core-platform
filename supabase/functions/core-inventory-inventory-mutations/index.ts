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
    const { action, data } = body;

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
      case 'addProduct':
        if (!data) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Product data is required for addProduct action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
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
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Unit data is required for addInventoryUnit action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
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
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Purchase order data is required for addPurchaseOrder action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
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
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid action. Supported actions: addProduct, addInventoryUnit, addPurchaseOrder'
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
    console.error('Inventory Mutations API Error:', error);
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
