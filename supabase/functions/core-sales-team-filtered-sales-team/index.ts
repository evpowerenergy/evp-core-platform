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
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid role. Must be one of: sale_package, sale_wholesale, manager_sale'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
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
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Role or roles parameter is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
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

    return new Response(
      JSON.stringify({
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
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Filtered Sales Team API Error:', error);
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
