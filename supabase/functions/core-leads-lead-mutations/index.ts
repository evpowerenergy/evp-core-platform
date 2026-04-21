/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers helper
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

  // Only allow POST method
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );
  }

  try {
    // Initialize Supabase client with environment variables (เหมือน API เดิม)
    // Priority: SERVICE_ROLE_KEY > ANON_KEY (เหมือน API เดิม)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('VITE_SUPABASE_ANON_KEY');
    
    // Use SERVICE_ROLE_KEY first (bypasses RLS), fallback to ANON_KEY (เหมือน API เดิม)
    const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[API] Missing Supabase credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'Supabase configuration missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Create Supabase client (ใช้ SERVICE_ROLE_KEY ถ้ามีเพื่อ bypass RLS เหมือน API เดิม)
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const body = await req.json();
    const { action, leadId, salesOwnerId, leadData, newCategory, updates } = body;

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
      case 'accept_lead':
        if (!leadId) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Lead ID is required for accept_lead action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }

        // Accept lead mutation
        const { data: acceptData, error: acceptError } = await supabase
          .from('leads')
          .update({ 
            sale_owner_id: salesOwnerId,
            status: 'กำลังติดตาม',
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId)
          .select()
          .single();

        if (acceptError) {
          throw new Error(`Failed to accept lead: ${acceptError.message}`);
        }

        result = acceptData;
        break;

      case 'assign_sales_owner':
        if (!leadId || !salesOwnerId) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Lead ID and Sales Owner ID are required for assign_sales_owner action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }

        // Assign sales owner mutation
        const { data: assignData, error: assignError } = await supabase
          .from('leads')
          .update({ 
            sale_owner_id: salesOwnerId,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId)
          .select()
          .single();

        if (assignError) {
          throw new Error(`Failed to assign sales owner: ${assignError.message}`);
        }

        result = assignData;
        break;

      case 'transfer_lead':
        if (!leadId) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Lead ID is required for transfer_lead action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }

        // Transfer lead mutation (เหมือน useMyLeadsWithMutations)
        const { data: transferData, error: transferError } = await supabase
          .from('leads')
          .update({ 
            sale_owner_id: null, // ลบ sale_owner_id
            category: newCategory, // เปลี่ยน category
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId)
          .select()
          .single();

        if (transferError) {
          throw new Error(`Failed to transfer lead: ${transferError.message}`);
        }

        result = transferData;
        break;

      case 'add_lead':
        if (!leadData) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Lead data is required for add_lead action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }

        // ใช้ database function ที่มี advisory lock เพื่อป้องกัน race condition
        // Function นี้จะทำการเช็ค duplicate และ insert ใน transaction เดียวกัน
        // ใช้ advisory lock เพื่อ lock เบอร์โทรที่กำลังจะ insert
        try {
          // Debug: Log leadData to check if is_from_ppa_project is included
          console.log('📝 LeadData received:', JSON.stringify(leadData, null, 2));
          console.log('📝 is_from_ppa_project in leadData:', leadData?.is_from_ppa_project, typeof leadData?.is_from_ppa_project);
          
          const { data: functionResult, error: functionError } = await supabase
            .rpc('safe_insert_lead_with_duplicate_check', {
              p_lead_data: leadData
            });

          if (functionError) {
            console.error('Error calling safe_insert_lead_with_duplicate_check:', functionError);
            throw new Error(`Failed to insert lead: ${functionError.message}`);
          }

          // Check result from function
          if (functionResult && typeof functionResult === 'object') {
            const resultObj = functionResult as any;
            
            if (resultObj.success === false) {
              // Duplicate found or other error
              return new Response(
                JSON.stringify({
                  success: false,
                  error: resultObj.error || 'Failed to insert lead',
                  errorCode: resultObj.errorCode || 'INSERT_ERROR',
                  existing_lead_id: resultObj.existing_lead_id || null
                }),
                {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  status: 400
                }
              );
            }

            // Success - fetch the inserted lead
            if (resultObj.lead_id) {
              const { data: insertedLead, error: fetchError } = await supabase
                .from('leads')
                .select('*')
                .eq('id', resultObj.lead_id)
                .single();

              if (fetchError) {
                console.error('Error fetching inserted lead:', fetchError);
                // Still return success with lead_id even if fetch fails
                result = { id: resultObj.lead_id };
              } else {
                result = insertedLead;
              }
            } else {
              throw new Error('Function returned success but no lead_id');
            }
          } else {
            throw new Error('Invalid response from safe_insert_lead_with_duplicate_check');
          }
        } catch (error: any) {
          console.error('Error in safe_insert_lead_with_duplicate_check:', error);
          throw new Error(`Failed to add lead: ${error.message}`);
        }
        break;

      case 'delete_lead':
        if (!leadId) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Lead ID is required for delete_lead action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }

        // Delete lead mutation - ลบเฉพาะจาก leads table เพราะมี trigger ใน database แล้ว
        const { error: deleteError } = await supabase
          .from('leads')
          .delete()
          .eq('id', leadId);

        if (deleteError) {
          throw new Error(`Failed to delete lead: ${deleteError.message}`);
        }

        result = { id: leadId, deleted: true };
        break;

      case 'update_lead':
        if (!leadId) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Lead ID is required for update_lead action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }

        const { updates } = body;
        if (!updates) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Updates data is required for update_lead action'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }

        // Update lead mutation
        const { data: updateData, error: updateError } = await supabase
          .from('leads')
          .update({ 
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update lead: ${updateError.message}`);
        }

        result = updateData;
        break;

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid action. Supported actions: accept_lead, assign_sales_owner, transfer_lead, add_lead, delete_lead, update_lead'
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
    console.error('Lead Mutations API Error:', error);
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
