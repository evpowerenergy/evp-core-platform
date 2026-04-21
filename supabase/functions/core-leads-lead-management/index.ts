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
    // Initialize Supabase client with environment variables
    // Priority: SERVICE_ROLE_KEY > ANON_KEY (เหมือน API เดิม)
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

    // Create Supabase client (use SERVICE_ROLE_KEY if available to bypass RLS like original API)
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse query parameters from URL
    const url = new URL(req.url);
    const queryParams = url.searchParams;
    
    const category = queryParams.get('category') || 'Package';
    const includeUserData = queryParams.get('includeUserData') || 'true';
    const includeSalesTeam = queryParams.get('includeSalesTeam') || 'true';
    const includeLeads = queryParams.get('includeLeads') || 'true';
    const userId = queryParams.get('userId');
    const dateFrom = queryParams.get('from');
    const dateTo = queryParams.get('to');
    const limit = queryParams.get('limit');

    console.log('[API] Lead Management Request:', {
      category,
      includeUserData,
      includeSalesTeam,
      includeLeads,
      userId,
      dateFrom,
      dateTo,
      limit
    });

    const result: any = {
      leads: [],
      salesTeam: [],
      user: null,
      salesMember: null
    };

    // Performance monitoring
    const startTime = performance.now();

    // Run independent queries in parallel for better performance
    console.log('[API] Starting database queries...');
    const [userResult, salesTeamResult, leadsResult] = await Promise.all([
      // 1. Get user data if needed
      includeUserData === 'true' && userId
        ? supabase
            .from('users')
            .select('id, first_name, last_name, role, department, position')
            .eq('auth_user_id', userId)
            .single()
        : Promise.resolve({ data: null, error: null }),
      
      // 2. Get sales team data if needed
      includeSalesTeam === 'true'
        ? supabase
            .from('sales_team_with_user_info')
            .select('id, user_id, name, email, status, current_leads, department, position')
            .eq('status', 'active')
        : Promise.resolve({ data: null, error: null }),
      
      // 3. Get leads data if needed
      includeLeads === 'true'
        ? (async () => {
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
                created_by,
                is_from_ppa_project
              `)
              .eq('category', category)
              .eq('has_contact_info', true) // ✅ เพิ่ม filter เหมือน hook เดิม
              .order('created_at_thai', { ascending: false });
            
            // Apply date filter if provided (priority over limit)
            if (dateFrom && dateTo) {
              query = query
                .gte('created_at_thai', dateFrom)
                .lte('created_at_thai', dateTo);
              // ✅ ไม่ต้อง limit เมื่อมี Date Filter - ให้ดึงข้อมูลทั้งหมดในช่วงวันที่
            } else if (limit) {
              // ⚠️ Fallback: ถ้าไม่มี Date Filter → ใช้ limit เพื่อป้องกัน
              query = query.limit(parseInt(limit as string));
            }
            // ⚠️ Safety: ถ้าไม่มีทั้ง Date Filter และ limit → ไม่ใช้ limit (ดึงทั้งหมด) - เหมือน API เดิม
            
            return await query;
          })()
        : Promise.resolve({ data: null, error: null })
    ]);

    console.log('[API] Database query results:', {
      userResult: userResult.data ? 'Found user' : 'No user',
      salesTeamResult: salesTeamResult.data ? `${salesTeamResult.data.length} members` : 'No sales team',
      leadsResult: leadsResult.data ? `${leadsResult.data.length} leads` : 'No leads',
      userError: userResult.error,
      salesTeamError: salesTeamResult.error,
      leadsError: leadsResult.error
    });

    // Handle user data
    if (userResult.data) {
      result.user = userResult.data;
      
      // Get sales member data for this user
      if (includeSalesTeam === 'true' && salesTeamResult.data) {
        const salesMember = salesTeamResult.data.find(
          (member: any) => member.user_id === userResult.data.id
        );
        result.salesMember = salesMember || null;
      }
    }

    // Handle sales team data
    if (salesTeamResult.data) {
      result.salesTeam = salesTeamResult.data;
    }

    // Handle leads data with creator information
    if (leadsResult.data && leadsResult.data.length > 0) {
      const leads = leadsResult.data;
      
        // Get creator information for each lead
        const creatorIds = [...new Set(leads.map((lead: any) => lead.created_by).filter(Boolean))];
      
      if (creatorIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', creatorIds);

        // Map creator names to leads
        const usersMap = new Map(usersData?.map((user: any) => [user.id, user]) || []);
        
        result.leads = leads.map((lead: any) => ({
          ...lead,
          creator_name: lead.created_by && usersMap.has(lead.created_by)
            ? `${(usersMap.get(lead.created_by) as any)?.first_name || ''} ${(usersMap.get(lead.created_by) as any)?.last_name || ''}`.trim()
            : 'ไม่ระบุ'
        }));
      } else {
        result.leads = leads.map((lead: any) => ({
          ...lead,
          creator_name: 'ไม่ระบุ'
        }));
      }
    }

    // Calculate statistics
    const stats = {
      totalLeads: result.leads.length,
      assignedLeads: result.leads.filter((lead: any) => lead.sale_owner_id).length,
      unassignedLeads: result.leads.filter((lead: any) => !lead.sale_owner_id).length,
      assignmentRate: result.leads.length > 0 
        ? (result.leads.filter((lead: any) => lead.sale_owner_id).length / result.leads.length) * 100 
        : 0,
      leadsWithContact: result.leads.filter((lead: any) => 
        lead.tel && lead.tel.trim() !== '' && lead.tel !== 'ไม่ระบุ'
      ).length,
      contactRate: result.leads.length > 0 
        ? (result.leads.filter((lead: any) => 
            lead.tel && lead.tel.trim() !== '' && lead.tel !== 'ไม่ระบุ'
          ).length / result.leads.length) * 100 
        : 0
    };

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...result,
          stats
        },
        meta: {
          executionTime: `${executionTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
          category,
          includeUserData: includeUserData === 'true',
          includeSalesTeam: includeSalesTeam === 'true',
          includeLeads: includeLeads === 'true'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Lead Management API Error:', error);
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
