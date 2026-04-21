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
    // Initialize Supabase client with environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('VITE_SUPABASE_ANON_KEY');
    
    // Use SERVICE_ROLE_KEY first (bypasses RLS), fallback to ANON_KEY
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
    
    // Parse query parameters
    const url = new URL(req.url);
    const queryParams = url.searchParams;
    
    // Get filter parameters
    const statusFilter = queryParams.get('status');
    const operationStatusFilter = queryParams.get('operation_status');
    const platformFilter = queryParams.get('platform');
    const categoryFilter = queryParams.get('category');
    const creatorFilter = queryParams.get('creator');
    const searchTerm = queryParams.get('search');
    const dateFrom = queryParams.get('from');
    const dateTo = queryParams.get('to');
    const type = queryParams.get('type'); // 'table' or 'chart'
    
    console.log('[API] All Leads Report Request:', { 
      statusFilter, 
      operationStatusFilter, 
      platformFilter, 
      categoryFilter, 
      creatorFilter, 
      searchTerm, 
      dateFrom, 
      dateTo,
      type 
    });

    // Performance monitoring
    const startTime = performance.now();

    // Build query based on type
    const isTable = type === 'table';
    const selectFields = isTable 
      ? `id, full_name, tel, line_id, status, platform, region, created_at_thai, sale_owner_id, post_sales_owner_id, category, operation_status, avg_electricity_bill, notes, display_name, created_by, is_from_ppa_project`
      : `platform, category, sale_owner_id, post_sales_owner_id, status, tel, line_id, operation_status, created_at_thai, created_by, region, is_from_ppa_project`;

    let query = supabase
      .from('leads')
      .select(selectFields)
      .eq('has_contact_info', true) // ✅ กรองเฉพาะลีดที่มีข้อมูลติดต่อ
      .order('created_at_thai', { ascending: false });

    // Apply filters
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (operationStatusFilter && operationStatusFilter !== 'all') {
      query = query.eq('operation_status', operationStatusFilter);
    }

    if (platformFilter && platformFilter !== 'all') {
      query = query.eq('platform', platformFilter);
    }

    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }

    if (creatorFilter && creatorFilter !== 'all') {
      query = query.eq('created_by', creatorFilter);
    }

    if (searchTerm && searchTerm.trim() !== '') {
      query = query.or(`full_name.ilike.%${searchTerm}%,tel.ilike.%${searchTerm}%,region.ilike.%${searchTerm}%`);
    }

    // Apply date range filter
    if (dateFrom && dateTo) {
      query = query
        .gte('created_at_thai', dateFrom)
        .lte('created_at_thai', dateTo);
    }

    const { data: leadsData, error: leadsError } = await query;

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      throw leadsError;
    }

    // Get creator information for table data only
    let enrichedLeads = leadsData || [];
    
    if (isTable && leadsData && leadsData.length > 0) {
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
          type: type || 'table',
          totalRecords: enrichedLeads.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('All Leads Report API Error:', error);
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

