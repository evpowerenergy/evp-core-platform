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

  // Only allow GET method
  if (req.method !== 'GET') {
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

    // Create Supabase client (ใช้ SERVICE_ROLE_KEY เพื่อ bypass RLS เหมือน API เดิม)
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse query parameters from URL
    const url = new URL(req.url);
    const queryParams = url.searchParams;
    const category = queryParams.get('category');
    const dateFrom = queryParams.get('from');
    const dateTo = queryParams.get('to');
    const limit = queryParams.get('limit');

    // Build the query
    let query = supabase
      .from('leads')
      .select(`
        id,
        full_name,
        display_name,
        tel,
        line_id,
        region,
        category,
        status,
        platform,
        sale_owner_id,
        created_at_thai,
        updated_at_thai,
        operation_status,
        avg_electricity_bill,
        notes,
        created_by
      `)
      .eq('has_contact_info', true) // ✅ กรองเฉพาะลีดที่มีข้อมูลติดต่อ (tel หรือ line_id)
      .order('created_at_thai', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    // Apply date filter if provided (priority over limit)
    if (dateFrom && dateTo) {
      query = query
        .gte('created_at_thai', dateFrom)
        .lte('created_at_thai', dateTo);
      // ✅ ไม่ต้อง limit เมื่อมี Date Filter - ให้ดึงข้อมูลทั้งหมดในช่วงวันที่
    } else if (limit) {
      // ⚠️ Fallback: ถ้าไม่มี Date Filter → ใช้ limit เพื่อป้องกัน
      query = query.limit(parseInt(limit));
    } else {
      // ⚠️ Safety: ถ้าไม่มีทั้ง Date Filter และ limit → ใช้ default limit (เหมือน API เดิม)
      query = query.limit(100);
    }

    const { data: leadsData, error: leadsError } = await query;

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return new Response(
        JSON.stringify({ success: false, error: leadsError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Get creator information for each lead
    if (leadsData && leadsData.length > 0) {
      const creatorIds = [...new Set(leadsData.map((lead: any) => lead.created_by).filter(Boolean))];

      if (creatorIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', creatorIds);

        if (!usersError && usersData) {
          const usersMap = new Map(usersData.map((user: any) => [user.id, user]));

          // Add creator_name to each lead
          leadsData.forEach((lead: any) => {
            if (lead.created_by && usersMap.has(lead.created_by)) {
              const user = usersMap.get(lead.created_by) as any;
              lead.creator_name = user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.first_name || user.last_name || 'ไม่ระบุ';
            } else {
              lead.creator_name = null;
            }
          });
        }
      }

      // Get latest productivity log for each lead
      const leadIds = leadsData.map((lead: any) => lead.id);

      if (leadIds.length > 0) {
        const { data: productivityLogsData, error: productivityLogsError } = await supabase
          .from('lead_productivity_logs')
          .select(`
            id,
            lead_id,
            sale_id,
            note,
            status,
            created_at_thai
          `)
          .in('lead_id', leadIds)
          .order('created_at_thai', { ascending: false });

        if (!productivityLogsError && productivityLogsData) {
          // Create map of latest productivity log for each lead
          const latestLogsMap = new Map();
          productivityLogsData.forEach((log: any) => {
            if (!latestLogsMap.has(log.lead_id)) {
              latestLogsMap.set(log.lead_id, log);
            }
          });

          // Add latest productivity log to each lead
          leadsData.forEach((lead: any) => {
            const latestLog = latestLogsMap.get(lead.id);
            lead.latest_productivity_log = latestLog || null;
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: { leads: leadsData || [] }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    console.error('Error in leads-list handler:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

