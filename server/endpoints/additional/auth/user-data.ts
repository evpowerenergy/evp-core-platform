import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any, env?: Record<string, string>) {
  // Initialize Supabase client with env variables
  const supabaseUrl = env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[API] Missing Supabase credentials');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Supabase configuration missing' }));
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

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

    if (!userId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'User ID is required' }));
      return;
    }

    // Get user info - include email and department
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, role, email, department')
      .eq('auth_user_id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch user data' }));
      return;
    }

    // Get sales team info if user is a sales role
    let salesMemberData: any = null;
    if (userData) {
      const { data: salesData, error: salesError } = await supabase
        .from('sales_team_with_user_info')
        .select('id, user_id, status, current_leads')
        .eq('user_id', userData.id)
        .single();
      
      if (!salesError && salesData) {
        salesMemberData = {
          ...salesData,
          name: userData.first_name && userData.last_name 
            ? `${userData.first_name} ${userData.last_name}`
            : 'Unknown User',
          role: userData.role
        };
      }
    }

    const result = {
      success: true,
      data: {
        user: userData,
        salesMember: salesMemberData
      }
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));

  } catch (error: any) {
    console.error('Error in user-data API:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
  }
}
