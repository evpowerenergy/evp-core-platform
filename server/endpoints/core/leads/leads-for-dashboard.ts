import { createClient } from '@supabase/supabase-js';
import { ServerResponse } from 'http';

export default async function handler(req: any, res: ServerResponse, env?: Record<string, string>) {
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
    // Parse query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const queryParams = url.searchParams;
    
    const dateFrom = queryParams.get('from');
    const dateTo = queryParams.get('to');
    const limit = queryParams.get('limit');
    
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
        category, 
        operation_status, 
        avg_electricity_bill, 
        notes, 
        display_name, 
        created_by,
        is_from_ppa_project
      `)
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
      const creatorIds = [...new Set(leadsData.map(lead => lead.created_by).filter(Boolean))];
      
      if (creatorIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', creatorIds);

        const usersMap = new Map(usersData?.map(user => [user.id, user]) || []);
        
        enrichedLeads = leadsData.map(lead => ({
          ...lead,
          creator_name: lead.created_by && usersMap.has(lead.created_by)
            ? `${usersMap.get(lead.created_by)?.first_name || ''} ${usersMap.get(lead.created_by)?.last_name || ''}`.trim()
            : 'ไม่ระบุ'
        }));
      } else {
        enrichedLeads = leadsData.map(lead => ({
          ...lead,
          creator_name: 'ไม่ระบุ'
        }));
      }
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
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
    }));

  } catch (error: any) {
    console.error('Dashboard Leads API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }));
  }
}

