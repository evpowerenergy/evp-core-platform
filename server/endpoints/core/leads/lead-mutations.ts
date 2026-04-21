import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any, env?: Record<string, string>) {
  // Initialize Supabase client with environment variables
  const supabaseUrl = env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || env?.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[API] Missing Supabase credentials');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Supabase configuration missing' }));
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const { action, leadId, salesOwnerId, leadData, newCategory, updates } = req.body;

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
      case 'accept_lead':
        if (!leadId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Lead ID is required for accept_lead action'
          }));
          return;
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
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Lead ID and Sales Owner ID are required for assign_sales_owner action'
          }));
          return;
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
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Lead ID is required for transfer_lead action'
          }));
          return;
        }

        const { newCategory } = req.body;

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
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Lead data is required for add_lead action'
          }));
          return;
        }

        // Validate and trim field lengths to prevent "value too long" errors
        // Note: After migration 20250117000000_increase_leads_field_lengths_with_generated_column.sql,
        // these fields can be up to 50 characters. Using 50 as the limit.
        const maxTelLength = 50;
        const maxPlatformLength = 50;
        
        const sanitizedLeadData = {
          ...leadData,
          tel: leadData.tel ? String(leadData.tel).trim().substring(0, maxTelLength) : leadData.tel,
          platform: leadData.platform ? String(leadData.platform).trim().substring(0, maxPlatformLength) : leadData.platform,
        };

        // Log warning if values were truncated
        if (leadData.tel && String(leadData.tel).trim().length > maxTelLength) {
          console.warn(`[Lead Mutations] Tel value truncated from ${String(leadData.tel).trim().length} to ${maxTelLength} characters`);
        }
        if (leadData.platform && String(leadData.platform).trim().length > maxPlatformLength) {
          console.warn(`[Lead Mutations] Platform value truncated from ${String(leadData.platform).trim().length} to ${maxPlatformLength} characters`);
        }

        // Add lead mutation
        const { data: addData, error: addError } = await supabase
          .from('leads')
          .insert([sanitizedLeadData])
          .select()
          .single();

        if (addError) {
          throw new Error(`Failed to add lead: ${addError.message}`);
        }

        result = addData;
        break;

      case 'update_lead':
        if (!leadId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Lead ID is required for update_lead action'
          }));
          return;
        }

        if (!updates) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Updates data is required for update_lead action'
          }));
          return;
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
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid action. Supported actions: accept_lead, assign_sales_owner, transfer_lead, add_lead, update_lead'
        }));
        return;
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

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
    console.error('Lead Mutations API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }));
  }
}
