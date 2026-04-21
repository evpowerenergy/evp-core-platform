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
    
    const dateRange = queryParams.get('dateRange');
    // Support both 'from/to' (used by useAppDataAPI) and 'dateFrom/dateTo' (legacy)
    const dateFrom = queryParams.get('from') || queryParams.get('dateFrom');
    const dateTo = queryParams.get('to') || queryParams.get('dateTo');

    console.log('[API] Sales Team Data Request:', { dateRange, dateFrom, dateTo });

    // Performance monitoring
    const startTime = performance.now();

    // Get sales team data with metrics
    const { data: salesTeam, error: salesTeamError } = await supabase
      .from('sales_team_with_user_info')
      .select('id, name, email, status, current_leads');

    if (salesTeamError || !salesTeam?.length) {
      const executionTime = performance.now() - startTime;
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            salesTeam: [],
            leads: [],
            quotations: []
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

    const salesOwnerIds = salesTeam.map(member => member.id);

    // Calculate date range if provided
    let dateFilter: { gte?: string; lte?: string } = {};
    if (dateFrom && dateTo) {
      // Use DateRange if provided
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      dateFilter = {
        gte: startDate.toISOString(),
        lte: endDate.toISOString()
      };
    } else if (dateRange) {
      // Fallback to string dateRange
      const endDate = new Date();
      const startDate = new Date();
      
      if (dateRange === 'today') {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate.setDate(endDate.getDate() - parseInt(dateRange));
      }
      
      dateFilter = {
        gte: startDate.toISOString(),
        lte: endDate.toISOString()
      };
    }

    // Get leads data for all sales members with date filter
    // รวมทั้ง sale_owner_id และ post_sales_owner_id สำหรับ current_leads และ conversion rate
    // ✅ ใช้ has_contact_info computed column แทนการกรอง tel/line_id แยก
    // ✅ Removed status filter to match Index page behavior - show all leads regardless of status
    // ✅ กรองเฉพาะ EV + Partner platforms (ให้ตรงกับ Index page และ All Leads Report)
    const evPlatforms = ['Facebook', 'Line', 'Website', 'TikTok', 'IG', 'YouTube', 'Shopee', 'Lazada', 'แนะนำ', 'Outbound', 'โทร', 'ลูกค้าเก่า service ครบ'];
    const partnerPlatforms = ['Huawei', 'Huawei (C&I)', 'ATMOCE', 'Solar Edge', 'Sigenergy', 'terawatt'];
    const allPlatforms = [...evPlatforms, ...partnerPlatforms];
    
    const salesOwnerIdsStr = salesOwnerIds.join(',');
    let allLeadsQuery = supabase
      .from('leads')
      .select('id, sale_owner_id, post_sales_owner_id, status, created_at_thai, tel, line_id, platform')
      .or(`sale_owner_id.in.(${salesOwnerIdsStr}),post_sales_owner_id.in.(${salesOwnerIdsStr})`)
      // ✅ Removed status filter - include all statuses to match Index page
      // ✅ ใช้ has_contact_info computed column แทน .or('tel.not.is.null,line_id.not.is.null')
      .eq('has_contact_info', true)
      // ✅ กรองเฉพาะ EV + Partner platforms (ให้ตรงกับ Index page และ All Leads Report)
      .in('platform', allPlatforms);

    if (dateFilter.gte && dateFilter.lte) {
      allLeadsQuery = allLeadsQuery
        .gte('created_at_thai', dateFilter.gte)
        .lte('created_at_thai', dateFilter.lte);
    }

    const { data: allLeads, error: leadsError } = await allLeadsQuery;

    // ✅ ต้องดึงข้อมูล quotations จริงๆ เพื่อนับดีลที่ปิดได้
    // ดึง productivity logs ที่ปิดการขายแล้วในช่วงเวลานั้น
    let closedLogsQuery = supabase
      .from('lead_productivity_logs')
      .select('id, lead_id, sale_id, status, created_at_thai')
      .eq('status', 'ปิดการขายแล้ว');

    if (dateFilter.gte && dateFilter.lte) {
      closedLogsQuery = closedLogsQuery
        .gte('created_at_thai', dateFilter.gte)
        .lte('created_at_thai', dateFilter.lte);
    }

    const { data: closedLogs } = await closedLogsQuery;
    const closedLogIds = closedLogs?.map(log => log.id) || [];

    // ดึง quotations ที่เกี่ยวข้องกับ logs เหล่านั้น
    let quotationsData: any[] = [];
    if (closedLogIds.length > 0) {
      const { data: quotations } = await supabase
        .from('quotations')
        .select('id, productivity_log_id, total_amount')
        .in('productivity_log_id', closedLogIds);
      quotationsData = quotations || [];
    }

    // Calculate additional metrics for each sales team member
    const enhancedSalesTeam = salesTeam.map(member => {
      // ✅ นับจาก quotations (1 Quotation = 1 Deal)
      const memberClosedLogs = closedLogs?.filter((log: any) => log.sale_id === member.id) || [];
      const memberLogIds = memberClosedLogs.map(log => log.id);
      const memberQuotations = quotationsData.filter(q => memberLogIds.includes(q.productivity_log_id));
      
      const dealsClosed = memberQuotations.length; // ✅ นับจำนวน quotations
      const pipelineValue = memberQuotations.reduce((sum, q) => sum + (q.total_amount || 0), 0);
      
      // Calculate conversion rate (deals closed / total leads) - convert to percentage
      // รวมทั้ง sale_owner_id และ post_sales_owner_id สำหรับ conversion rate
      const totalLeads = allLeads?.filter((lead: any) => 
        (lead.sale_owner_id === member.id || lead.post_sales_owner_id === member.id)
      ).length || 0;
      const conversionRate = totalLeads > 0 ? (dealsClosed / totalLeads) * 100 : 0;

      return {
        ...member,
        deals_closed: dealsClosed,
        pipeline_value: pipelineValue,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        total_leads: totalLeads
      };
    });

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          salesTeam: enhancedSalesTeam || [],
          leads: leadsError ? [] : (allLeads || []),
          quotations: quotationsData || []
        },
        meta: {
          executionTime: `${executionTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
          dateRange,
          dateFrom,
          dateTo,
          totalMembers: salesTeam.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Sales Team Data API Error:', error);
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
