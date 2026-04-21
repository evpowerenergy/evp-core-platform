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
    
    const userId = queryParams.get('userId');
    const category = queryParams.get('category') || 'Package';

    if (!userId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'User ID is required'
      }));
      return;
    }

    console.log('[API] My Leads Request:', { userId, category });

    // Performance monitoring
    const startTime = performance.now();

    // Get user data and sales member info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, role')
      .eq('auth_user_id', userId)
      .single();

    if (userError || !userData) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          leads: [],
          user: null,
          salesMember: null
        },
        meta: {
          executionTime: `${(performance.now() - startTime).toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        }
      }));
      return;
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
    const { data: ownerLeads, error: ownerLeadsError } = await supabase
      .from('leads')
      .select(`
        id, full_name, tel, line_id, status, platform, region, 
        created_at_thai, updated_at_thai, sale_owner_id, post_sales_owner_id, category, 
        operation_status, avg_electricity_bill, notes, display_name, created_by
      `)
      .eq('sale_owner_id', salesMember?.id || 0)
      .eq('category', category)
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

      // Get latest productivity log for each lead (เหมือน hook เดิม)
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

    // Calculate statistics
    const stats = {
      totalLeads: enrichedLeads.length,
      leadsWithContact: enrichedLeads.filter(lead => 
        lead.tel && lead.tel.trim() !== '' && lead.tel !== 'ไม่ระบุ'
      ).length,
      byStatus: {
        'กำลังติดตาม': enrichedLeads.filter(lead => lead.status === 'กำลังติดตาม').length,
        'ปิดการขาย': enrichedLeads.filter(lead => lead.status === 'ปิดการขาย').length,
        'ปิดการขายแล้ว': enrichedLeads.filter(lead => lead.operation_status === 'ปิดการขายแล้ว').length,
        'ปิดการขายไม่สำเร็จ': enrichedLeads.filter(lead => lead.operation_status === 'ปิดการขายไม่สำเร็จ').length
      },
      byPlatform: {
        'Facebook': enrichedLeads.filter(lead => lead.platform === 'Facebook').length,
        'Line': enrichedLeads.filter(lead => lead.platform === 'Line').length,
        'Website': enrichedLeads.filter(lead => lead.platform === 'Website').length,
        'Phone': enrichedLeads.filter(lead => lead.platform === 'Phone').length
      }
    };

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        leads: enrichedLeads,
        user: userData,
        salesMember
      },
      stats,
      meta: {
        executionTime: `${executionTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
        userId,
        category,
        salesMemberId: salesMember?.id
      }
    }));

  } catch (error: any) {
    console.error('My Leads API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }));
  }
}
