/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
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

    if (req.method === 'GET') {
      // Parse query parameters
      const url = new URL(req.url);
      const queryParams = url.searchParams;
      const leadId = queryParams.get('leadId');
      const action = queryParams.get('action');

      if (!leadId) {
        return new Response(
          JSON.stringify({ error: 'Lead ID is required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      if (action === 'detail') {
        // Get lead detail - ใช้ select('*') เพื่อให้ได้ทุก field รวมถึง ad_campaign_id
        // และเพิ่ม created_at_thai, updated_at_thai ที่เป็น computed columns
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (leadError) {
          console.error('Error fetching lead:', leadError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch lead' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500
            }
          );
        }

        // Debug: Log lead data to check ad_campaign_id
        console.log('📋 Lead fetched from database:', {
          id: lead?.id,
          ad_campaign_id: lead?.ad_campaign_id,
          ad_campaign_id_type: typeof lead?.ad_campaign_id,
          ad_campaign_id_value: lead?.ad_campaign_id,
          has_ad_campaign_id: 'ad_campaign_id' in (lead || {}),
          lead_keys: lead ? Object.keys(lead) : [],
          lead_raw: JSON.stringify(lead)
        });

        // ตรวจสอบว่า ad_campaign_id มีอยู่ใน response หรือไม่
        // ถ้าไม่มี ให้ query ใหม่โดยระบุ field ชัดเจน
        if (lead && !('ad_campaign_id' in lead)) {
          console.warn('⚠️ ad_campaign_id not found in select("*"), trying explicit select...');
          const { data: leadWithCampaign, error: leadError2 } = await supabase
            .from('leads')
            .select('id, ad_campaign_id')
            .eq('id', leadId)
            .single();
          
          if (!leadError2 && leadWithCampaign) {
            console.log('✅ Found ad_campaign_id with explicit select:', leadWithCampaign.ad_campaign_id);
            lead.ad_campaign_id = leadWithCampaign.ad_campaign_id;
          }
        }

        return new Response(
          JSON.stringify({ success: true, data: lead }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      if (action === 'latest-log') {
        // Get latest productivity log
        const { data: log, error: logError } = await supabase
          .from('lead_productivity_logs')
          .select(`
            *,
            appointments(*),
            credit_evaluation(*),
            lead_products(*, products(*))
          `)
          .eq('lead_id', leadId)
          .order('created_at_thai', { ascending: false })
          .limit(1)
          .single();

        if (logError && logError.code !== 'PGRST116') {
          console.error('Error fetching latest log:', logError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch latest log' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500
            }
          );
        }

        if (log) {
          // Get quotations and quotation documents
          const [quotationsData, quotationDocumentsData] = await Promise.all([
            supabase
              .from('quotations')
              .select('*')
              .eq('productivity_log_id', log.id),
            supabase
              .from('quotation_documents')
              .select('*')
              .eq('productivity_log_id', log.id)
          ]);

          const result = {
            ...log,
            quotations: quotationsData.data || [],
            quotation_documents: quotationDocumentsData.data || []
          };

          return new Response(
            JSON.stringify({ success: true, data: result }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: null }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    if (req.method === 'PUT') {
      // Parse request body
      const body = await req.json();
      const { leadId, updates } = body;

      if (!leadId) {
        return new Response(
          JSON.stringify({ error: 'Lead ID is required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('Error updating lead:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update lead' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );

  } catch (error: any) {
    console.error('[API] Lead Detail Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
