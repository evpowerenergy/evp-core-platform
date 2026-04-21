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

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    // Parse query parameters from URL
    const url = new URL(req.url, `http://${req.headers.host}`);
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
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          salesTeam: [],
          leads: [],
          quotations: []
        },
        meta: {
          executionTime: `${(performance.now() - startTime).toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        }
      }));
      return;
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
    // Note: Filter for leads with contact info (tel or line_id) - ใช้ฟิลเตอร์แบบเดียวกับ hook เดิม
    let allLeadsQuery = supabase
      .from('leads')
      .select('id, sale_owner_id, status, created_at_thai, tel, line_id')
      .in('sale_owner_id', salesOwnerIds)
      .in('status', ['กำลังติดตาม', 'ปิดการขาย'])
      // Filter: มี tel หรือ line_id ไม่เป็นค่าว่าง
      .or('tel.not.is.null,line_id.not.is.null');

    if (dateFilter.gte && dateFilter.lte) {
      allLeadsQuery = allLeadsQuery
        .gte('created_at_thai', dateFilter.gte)
        .lte('created_at_thai', dateFilter.lte);
    }

    const { data: allLeads, error: leadsError } = await allLeadsQuery;

    // Get sales data for the period if date filter is provided
    let quotationsData: any[] = [];
    let productivityLogsData: any[] = [];
    let salesData: any = null;
    
    if (dateFilter.gte && dateFilter.lte) {
      try {
        // This would need to be implemented based on getSalesDataInPeriod utility
        // For now, we'll return empty data
        quotationsData = [];
        productivityLogsData = [];
        salesData = null;
      } catch (error) {
        console.error('Error getting sales data in period:', error);
        quotationsData = [];
        productivityLogsData = [];
        salesData = null;
      }
    }

    // Calculate additional metrics for each sales team member
    const enhancedSalesTeam = salesTeam.map(member => {
      let dealsClosed = 0;
      let pipelineValue = 0;
      
      if (salesData?.salesLeads) {
        // ✅ ใช้ saleId จาก log (คนที่ปิดการขายจริงๆ) แทน saleOwnerId จาก lead
        const memberSalesLeads = salesData.salesLeads.filter((lead: any) => 
          (lead.saleId || lead.saleOwnerId) === member.id
        );
        dealsClosed = memberSalesLeads.reduce((sum: number, lead: any) => sum + (lead.totalQuotationCount || 0), 0);
        pipelineValue = memberSalesLeads.reduce((sum: number, lead: any) => sum + (lead.totalQuotationAmount || 0), 0);
      } else {
        // Fallback: Count deals closed by this member from productivity logs - ใช้ sale_id จาก productivity logs
        const memberClosedLogs = productivityLogsData?.filter((log: any) => 
          log.sale_id === member.id && log.status === 'ปิดการขายแล้ว'
        ) || [];
        dealsClosed = memberClosedLogs.length;
        
        const memberQuotations = quotationsData?.filter((quotation: any) => {
          const productivityLog = productivityLogsData?.find((log: any) => log.id === quotation.productivity_log_id);
          // ✅ ใช้ sale_id จาก productivity log แทน sale_owner_id จาก lead
          return productivityLog?.sale_id === member.id;
        }) || [];
        pipelineValue = memberQuotations.reduce((sum: number, quotation: any) => 
          sum + (quotation.amount || 0), 0
        );
      }
      
      // Calculate conversion rate
      const totalLeads = allLeads?.filter((lead: any) => 
        lead.sale_owner_id === member.id
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

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
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
    }));

  } catch (error: any) {
    console.error('Sales Team Data API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }));
  }
}
