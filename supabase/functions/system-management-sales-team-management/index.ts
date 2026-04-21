/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// API สำหรับจัดการ Sales Team (เหมือน API เดิม - logic ตรงกัน)
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

  try {
    // Initialize Supabase client with environment variables (เหมือน API เดิม)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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

    // Parse query parameters from URL (เหมือน API เดิม)
    const url = new URL(req.url);
    const queryParams = url.searchParams;
    const id = queryParams.get('id');

    if (req.method === 'GET') {
      // Get single sales team member by ID (เหมือน API เดิม - logic ตรงกัน)
      if (id) {
        const { data, error } = await supabase
          .from('sales_team_with_user_info')
          .select('id, user_id, current_leads, status, name')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          return new Response(
            JSON.stringify({ success: false, error: 'Sales team member not found' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404
            }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // Get all sales team members (เหมือน API เดิม - logic ตรงกัน)
      const { data, error } = await supabase
        .from('sales_team_with_user_info')
        .select('id, user_id, current_leads, status, name');

      if (error) {
        throw error;
      }

      // Map the data to ensure proper structure (เหมือน API เดิม)
      const mappedData = data?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        current_leads: item.current_leads,
        status: item.status,
        name: item.name || 'Unknown User',
      })) || [];

      return new Response(
        JSON.stringify({ success: true, data: mappedData }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    if (req.method === 'POST') {
      // Create new sales team member (เหมือน API เดิม - logic ตรงกัน)
      const body = await req.json();

      if (!body.user_id) {
        return new Response(
          JSON.stringify({ error: 'user_id is required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
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

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201
        }
      );
    }

    if (req.method === 'PUT') {
      // Update sales team member (เหมือน API เดิม - logic ตรงกัน)
      const body = await req.json();

      if (!body.id) {
        return new Response(
          JSON.stringify({ error: 'id is required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
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

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    if (req.method === 'DELETE') {
      // Delete sales team member (เหมือน API เดิม - logic ตรงกัน)
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'id is required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      const { error } = await supabase
        .from('sales_team_with_user_info')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Sales team member deleted' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );
  } catch (error: any) {
    console.error('[API] Sales Team Management Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
