/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
};

Deno.serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  // Allow both GET and POST methods (POST for supabase.functions.invoke)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );
  }

  try {
    // Initialize Supabase client with environment variables (เหมือน API เดิม - ใช้ SERVICE_ROLE_KEY > ANON_KEY)
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

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse parameters - support both GET (query params) and POST (body)
    let dateFrom: string | null = null;
    let dateTo: string | null = null;
    let limit: string | null = null;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const queryParams = url.searchParams;
      dateFrom = queryParams.get('from');
      dateTo = queryParams.get('to');
      limit = queryParams.get('limit');
    } else if (req.method === 'POST') {
      try {
        const body = await req.json();
        dateFrom = body.startDate || body.from || null;
        dateTo = body.endDate || body.to || null;
        limit = body.limit || null;
      } catch (e) {
        // If body parsing fails, try query params as fallback
        const url = new URL(req.url);
        const queryParams = url.searchParams;
        dateFrom = queryParams.get('from');
        dateTo = queryParams.get('to');
        limit = queryParams.get('limit');
      }
    }
    
    console.log('[API] Dashboard Leads Request:', { dateFrom, dateTo, limit });

    // Performance monitoring
    const startTime = performance.now();

    // Build query
    let query = supabase
      .from('leads')
      .select(`
        id, 
        full_name, 
        tel, 
        line_id, 
        status, 
        platform, 
        region, 
        created_at_thai, 
        updated_at_thai, 
        sale_owner_id, 
        post_sales_owner_id,
        category, 
        operation_status, 
        avg_electricity_bill, 
        notes, 
        display_name, 
        created_by,
        is_from_ppa_project
      `)
      .eq('has_contact_info', true) // ✅ กรองเฉพาะลีดที่มีข้อมูลติดต่อ (tel หรือ line_id)
      .order('created_at_thai', { ascending: false });

    // Apply date filter if provided
    if (dateFrom && dateTo) {
      query = query
        .gte('created_at_thai', dateFrom)
        .lte('created_at_thai', dateTo);
      // ✅ ไม่ต้อง limit เมื่อมี Date Filter - ให้ดึงข้อมูลทั้งหมดในช่วงวันที่
    } else if (limit) {
      // ⚠️ Fallback: ถ้าไม่มี Date Filter → ใช้ limit เพื่อป้องกัน
      query = query.limit(parseInt(limit));
    } else {
      // ⚠️ Safety: ถ้าไม่มีทั้ง Date Filter และ limit → ใช้ default limit
      query = query.limit(5000);
    }

    const { data: leadsData, error: leadsError } = await query;

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      throw leadsError;
    }

    // Get creator information for each lead
    let enrichedLeads = leadsData || [];
    
    if (leadsData && leadsData.length > 0) {
      const creatorIds = [...new Set(leadsData.map((lead: any) => lead.created_by).filter(Boolean))];
      
      if (creatorIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', creatorIds);

        const usersMap = new Map(usersData?.map((user: any) => [user.id, user]) || []);
        
        enrichedLeads = leadsData.map((lead: any) => ({
          ...lead,
          creator_name: lead.created_by && usersMap.has(lead.created_by)
            ? `${(usersMap.get(lead.created_by) as any)?.first_name || ''} ${(usersMap.get(lead.created_by) as any)?.last_name || ''}`.trim()
            : 'ไม่ระบุ'
        }));
      } else {
        enrichedLeads = leadsData.map((lead: any) => ({
          ...lead,
          creator_name: 'ไม่ระบุ'
        }));
      }
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: enrichedLeads,
        meta: {
          executionTime: `${executionTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          limit: limit ? parseInt(limit) : null,
          totalRecords: enrichedLeads.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Dashboard Leads API Error:', error);
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
