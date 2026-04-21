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
    
    // Support both 'roles' (comma-separated) and 'role' (single) parameters
    const rolesParam = queryParams.get('roles');
    const roleParam = queryParams.get('role');
    
    let rolesToInclude: string[] = [];
    
    if (rolesParam) {
      // If 'roles' parameter is provided (comma-separated), use it directly
      rolesToInclude = rolesParam.split(',').map(r => r.trim());
    } else if (roleParam) {
      // If 'role' parameter is provided, calculate rolesToInclude
      let role = roleParam;
      
      if (!['sale_package', 'sale_wholesale', 'manager_sale'].includes(role)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid role. Must be one of: sale_package, sale_wholesale, manager_sale'
        }));
        return;
      }
      
      // Define roles to include based on the requested role
      if (role === 'sale_package') {
        // For package, include both sale_package and manager_sale
        rolesToInclude = ['sale_package', 'manager_sale'];
      } else if (role === 'sale_wholesale') {
        // For wholesale, include both sale_wholesale and manager_sale
        rolesToInclude = ['sale_wholesale', 'manager_sale'];
      } else {
        // For manager_sale only
        rolesToInclude = ['manager_sale'];
      }
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Role or roles parameter is required'
      }));
      return;
    }

    console.log('[API] Filtered Sales Team Request:', { rolesParam, roleParam, rolesToInclude });

    // Performance monitoring
    const startTime = performance.now();
    
    // Get sales team data filtered by specific roles
    const { data: salesTeam, error: salesTeamError } = await supabase
      .from('sales_team_with_user_info')
      .select(`
        id, name, email, status, current_leads, user_id,
        users!inner(role)
      `)
      .in('users.role', rolesToInclude)
      .eq('status', 'active');

    if (salesTeamError) {
      throw new Error(`Failed to fetch filtered sales team: ${salesTeamError.message}`);
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        salesTeam: salesTeam || []
      },
      meta: {
        executionTime: `${executionTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
        roleParam,
        rolesParam,
        rolesToInclude,
        totalMembers: salesTeam?.length || 0
      }
    }));

  } catch (error: any) {
    console.error('Filtered Sales Team API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }));
  }
}
