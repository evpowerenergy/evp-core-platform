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
    const { action, id, data } = body;

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
      case 'createCustomerService':
        if (!data) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Data is required for createCustomerService action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }

        // Create customer service (เหมือน useCreateCustomerService)
        const { data: createResult, error: createError } = await supabase
          .from("customer_services")
          .insert(data)
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create customer service: ${createError.message}`);
        }

        result = createResult;
        break;

      case 'updateCustomerService':
        if (!id || !data) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'ID and data are required for updateCustomerService action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
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
          return new Response(
            JSON.stringify({
              success: false,
              error: 'ID is required for deleteCustomerService action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
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

      case 'createCustomerServicePurchase':
        if (!data) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Data is required for createCustomerServicePurchase action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }

        // Create customer service purchase
        const { data: createPurchaseResult, error: createPurchaseError } = await supabase
          .from("customer_service_purchases")
          .insert(data)
          .select()
          .single();

        if (createPurchaseError) {
          throw new Error(`Failed to create customer service purchase: ${createPurchaseError.message}`);
        }

        result = createPurchaseResult;
        break;

      case 'updateCustomerServicePurchase':
        if (!id || !data) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'ID and data are required for updateCustomerServicePurchase action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }

        // Update customer service purchase
        const { data: updatePurchaseResult, error: updatePurchaseError } = await supabase
          .from("customer_service_purchases")
          .update(data)
          .eq("id", id)
          .select()
          .single();

        if (updatePurchaseError) {
          throw new Error(`Failed to update customer service purchase: ${updatePurchaseError.message}`);
        }

        result = updatePurchaseResult;
        break;

      case 'deleteCustomerServicePurchase':
        if (!id) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'ID is required for deleteCustomerServicePurchase action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }

        // Delete customer service purchase
        const { error: deletePurchaseError } = await supabase
          .from("customer_service_purchases")
          .delete()
          .eq("id", id);

        if (deletePurchaseError) {
          throw new Error(`Failed to delete customer service purchase: ${deletePurchaseError.message}`);
        }

        result = { deleted: true, id };
        break;

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid action. Supported actions: createCustomerService, updateCustomerService, deleteCustomerService, createCustomerServicePurchase, updateCustomerServicePurchase, deleteCustomerServicePurchase'
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
    console.error('Customer Service Mutations API Error:', error);
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
