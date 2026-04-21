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

  // Parse query parameters from URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const queryParams = url.searchParams;
  const id = queryParams.get('id');

  try {
    if (req.method === 'GET') {
      // Get single sales team member by ID
      if (id) {
        const { data, error } = await supabase
          .from('sales_team_with_user_info')
          .select('id, user_id, current_leads, status, name')
          .eq('id', id)
          .single();

        if (error) throw error;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data }));
        return;
      }

      // Get all sales team members
      const { data, error } = await supabase
        .from('sales_team_with_user_info')
        .select('id, user_id, current_leads, status, name');

      if (error) throw error;

      // Map the data to ensure proper structure
      const mappedData = data?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        current_leads: item.current_leads,
        status: item.status,
        name: item.name || 'Unknown User',
      })) || [];

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: mappedData }));
      return;
    }

    if (req.method === 'POST') {
      // Create new sales team member
      const body = req.body;

      if (!body.user_id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'user_id is required' }));
        return;
      }

      const { data, error } = await supabase
        .from('sales_team_with_user_info')
        .insert({
          user_id: body.user_id,
          current_leads: body.current_leads || 0,
          status: body.status || 'active',
        })
        .select()
        .single();

      if (error) throw error;

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data }));
      return;
    }

    if (req.method === 'PUT') {
      // Update sales team member
      const body = req.body;

      if (!body.id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'id is required' }));
        return;
      }

      const updateData: any = {};
      if (body.current_leads !== undefined) updateData.current_leads = body.current_leads;
      if (body.status !== undefined) updateData.status = body.status;

      const { data, error } = await supabase
        .from('sales_team_with_user_info')
        .update(updateData)
        .eq('id', body.id)
        .select()
        .single();

      if (error) throw error;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data }));
      return;
    }

    if (req.method === 'DELETE') {
      // Delete sales team member
      if (!id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'id is required' }));
        return;
      }

      const { error } = await supabase
        .from('sales_team_with_user_info')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Sales team member deleted' }));
      return;
    }

    // Method not allowed
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  } catch (error: any) {
    console.error('[API] Sales Team Management Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
  }
}

