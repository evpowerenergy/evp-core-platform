/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    // Initialize Supabase client with environment variables (เหมือน API เดิม - ใช้ SERVICE_ROLE_KEY หรือ ANON_KEY)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('VITE_SUPABASE_ANON_KEY');

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

    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405
        }
      );
    }

    // Parse query parameters from URL
    const url = new URL(req.url);
    const queryParams = url.searchParams;
    
    const userId = queryParams.get('userId');
    const category = queryParams.get('category') || 'Package';

    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User ID is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    console.log('[API] My Leads Data Request:', { userId, category });

    // Performance monitoring
    const startTime = performance.now();

    // Get user data and sales member info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, role')
      .eq('auth_user_id', userId)
      .single();

    if (userError || !userData) {
      const executionTime = performance.now() - startTime;
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            leads: [],
            user: null,
            salesMember: null
          },
          meta: {
            executionTime: `${executionTime.toFixed(2)}ms`,
            timestamp: new Date().toISOString()
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Get sales member data
    const { data: salesData, error: salesError } = await supabase
      .from('sales_team_with_user_info')
      .select('id, user_id, status, current_leads')
      .eq('user_id', userData.id)
      .single();

    const salesMember = salesError || !salesData ? null : {
      ...salesData,
      name: userData.first_name && userData.last_name 
        ? `${userData.first_name} ${userData.last_name}`
        : 'Unknown User',
      role: userData.role
    };

    // Get leads for this sales member
    // Query ทั้ง sale_owner_id และ post_sales_owner_id เพื่อให้เห็น lead ทั้งหมด
    // ✅ ใช้ has_contact_info computed column เพื่อกรองเฉพาะลีดที่มีข้อมูลติดต่อ
    const { data: ownerLeads, error: ownerLeadsError } = await supabase
      .from('leads')
      .select(`
        id, full_name, tel, line_id, status, platform, region, 
        created_at_thai, updated_at_thai, sale_owner_id, post_sales_owner_id, category, 
        operation_status, avg_electricity_bill, notes, display_name, created_by
      `)
      .eq('sale_owner_id', salesMember?.id || 0)
      .eq('category', category)
      .eq('has_contact_info', true) // ✅ กรองเฉพาะลีดที่มีข้อมูลติดต่อ
      .order('updated_at_thai', { ascending: false });

    const { data: postSalesLeads, error: postSalesLeadsError } = await supabase
      .from('leads')
      .select(`
        id, full_name, tel, line_id, status, platform, region, 
        created_at_thai, updated_at_thai, sale_owner_id, post_sales_owner_id, category, 
        operation_status, avg_electricity_bill, notes, display_name, created_by
      `)
      .eq('post_sales_owner_id', salesMember?.id || 0)
      .eq('category', category)
      .eq('has_contact_info', true) // ✅ กรองเฉพาะลีดที่มีข้อมูลติดต่อ
      .order('updated_at_thai', { ascending: false });

    // รวมและ distinct leads (ไม่ให้ซ้ำ)
    const allLeadsMap = new Map();
    (ownerLeads || []).forEach(lead => {
      allLeadsMap.set(lead.id, lead);
    });
    (postSalesLeads || []).forEach(lead => {
      allLeadsMap.set(lead.id, lead);
    });
    const leads = Array.from(allLeadsMap.values());
    const leadsError = ownerLeadsError || postSalesLeadsError;

    if (leadsError) {
      throw new Error(`Failed to fetch leads: ${leadsError.message}`);
    }

    // Get creator information for each lead
    let enrichedLeads = leads || [];
    
    if (leads && leads.length > 0) {
      const creatorIds = [...new Set(leads.map(lead => lead.created_by).filter(Boolean))];
      
      if (creatorIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', creatorIds);

        // Map creator names to leads
        const usersMap = new Map(usersData?.map(user => [user.id, user]) || []);
        
        enrichedLeads = leads.map(lead => ({
          ...lead,
          creator_name: lead.created_by && usersMap.has(lead.created_by)
            ? `${usersMap.get(lead.created_by)?.first_name || ''} ${usersMap.get(lead.created_by)?.last_name || ''}`.trim()
            : 'ไม่ระบุ'
        }));
      } else {
        enrichedLeads = leads.map(lead => ({
          ...lead,
          creator_name: 'ไม่ระบุ'
        }));
      }

      // Get latest productivity log for each lead
      const leadIds = enrichedLeads.map(lead => lead.id);
      
      if (leadIds.length > 0) {
        const { data: productivityLogsData } = await supabase
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

        if (productivityLogsData) {
          // สร้าง map ของ productivity log ล่าสุดสำหรับแต่ละ lead
          const latestLogsMap = new Map();
          productivityLogsData.forEach(log => {
            if (!latestLogsMap.has(log.lead_id)) {
              latestLogsMap.set(log.lead_id, log);
            }
          });

          // เพิ่มข้อมูล productivity log ล่าสุดให้กับแต่ละ lead
          enrichedLeads = enrichedLeads.map(lead => ({
            ...lead,
            latest_productivity_log: latestLogsMap.get(lead.id) || null
          }));
        }
      }
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          leads: enrichedLeads,
          user: userData,
          salesMember
        },
        meta: {
          executionTime: `${executionTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
          userId,
          category,
          salesMemberId: salesMember?.id
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('My Leads Data API Error:', error);
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
