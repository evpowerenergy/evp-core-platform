import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any, env?: Record<string, string>) {
  // ✅ 1. Accept env parameter and read from it
  const supabaseUrl = env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Supabase configuration missing' }));
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
    return;
  }

  try {
    // ✅ 2. Parse query parameters from URL
    const url = new URL(req.url, `http://${req.headers.host}`);
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
      // ⚠️ Safety: ถ้าไม่มีทั้ง Date Filter และ limit → ใช้ default limit
      query = query.limit(100);
    }

    const { data: leadsData, error: leadsError } = await query;

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: leadsError.message }));
      return;
    }

    // Get creator information for each lead
    if (leadsData && leadsData.length > 0) {
      const creatorIds = [...new Set(leadsData.map(lead => lead.created_by).filter(Boolean))];

      if (creatorIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', creatorIds);

        if (!usersError && usersData) {
          const usersMap = new Map(usersData.map(user => [user.id, user]));

          // Add creator_name to each lead
          leadsData.forEach(lead => {
            if (lead.created_by && usersMap.has(lead.created_by)) {
              const user = usersMap.get(lead.created_by);
              (lead as any).creator_name = user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.first_name || user.last_name || 'ไม่ระบุ';
            } else {
              (lead as any).creator_name = null;
            }
          });
        }
      }

      // Get latest productivity log for each lead
      const leadIds = leadsData.map(lead => lead.id);

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
          productivityLogsData.forEach(log => {
            if (!latestLogsMap.has(log.lead_id)) {
              latestLogsMap.set(log.lead_id, log);
            }
          });

          // Add latest productivity log to each lead
          leadsData.forEach(lead => {
            const latestLog = latestLogsMap.get(lead.id);
            (lead as any).latest_productivity_log = latestLog || null;
          });
        }
      }
    }

    // ✅ 3. Use native response API
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      data: { leads: leadsData || [] }
    }));
  } catch (error: any) {
    console.error('Error in leads-list handler:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}
