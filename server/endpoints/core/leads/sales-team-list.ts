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
    // Fetch sales team data
    const { data: salesTeamData, error: salesTeamError } = await supabase
      .from('sales_team_with_user_info')
      .select('id, user_id, current_leads, status, name, email, phone, department, position')
      .eq('status', 'active');

    if (salesTeamError) {
      console.error('Error fetching sales team:', salesTeamError);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: salesTeamError.message }));
      return;
    }

    if (salesTeamData) {
      const mappedData = salesTeamData.map(item => ({
        id: item.id,
        user_id: item.user_id,
        current_leads: item.current_leads,
        status: item.status,
        name: item.name || 'Unknown User',
        email: item.email,
        phone: item.phone,
        department: item.department,
        position: item.position,
      }));

      // ✅ Use native response API
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: { salesTeam: mappedData }
      }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        data: { salesTeam: [] }
      }));
    }
  } catch (error: any) {
    console.error('Error in sales-team-list handler:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: error.message }));
  }
}
