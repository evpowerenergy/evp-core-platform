/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// API สำหรับจัดการ Service Appointments (เหมือน API เดิม - logic ตรงกัน)
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

    // GET: Query appointments (เหมือน API เดิม - logic ตรงกัน)
    if (req.method === 'GET') {
      const action = queryParams.get('action');

      // 1. Get all appointments with filters (เหมือน API เดิม)
      if (action === 'list' || !action) {
        const date = queryParams.get('date');
        const startDate = queryParams.get('startDate');
        const endDate = queryParams.get('endDate');
        const technician = queryParams.get('technician');
        const status = queryParams.get('status');

        let query = supabase
          .from("service_appointments")
          .select(`
            *,
            customer:customer_services(
              id,
              customer_group,
              tel,
              province,
              district,
              capacity_kw
            )
          `)
          .order("appointment_date", { ascending: true });

        // Filter by specific date (เหมือน API เดิม)
        if (date) {
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);
          
          query = query
            .gte("appointment_date", startOfDay.toISOString())
            .lte("appointment_date", endOfDay.toISOString());
        }

        // Filter by date range (เหมือน API เดิม)
        if (startDate && endDate) {
          const startOfDay = new Date(startDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          query = query
            .gte("appointment_date", startOfDay.toISOString())
            .lte("appointment_date", endOfDay.toISOString());
        }

        // Filter by technician (เหมือน API เดิม)
        if (technician) {
          query = query.eq("technician_name", technician);
        }

        // Filter by status (เหมือน API เดิม)
        if (status) {
          query = query.eq("status", status);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch appointments: ${error.message}`);
        }

        return new Response(
          JSON.stringify({ success: true, data }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // 2. Get monthly appointments (for calendar) (เหมือน API เดิม)
      if (action === 'monthly') {
        const year = queryParams.get('year');
        const month = queryParams.get('month');

        if (!year || !month) {
          return new Response(
            JSON.stringify({ error: 'year and month are required' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }

        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        const startDate = new Date(yearNum, monthNum, 1);
        const endDate = new Date(yearNum, monthNum + 1, 0, 23, 59, 59);

        const { data, error } = await supabase
          .from("service_appointments")
          .select("*")
          .gte("appointment_date", startDate.toISOString())
          .lte("appointment_date", endDate.toISOString())
          .order("appointment_date", { ascending: true });

        if (error) {
          throw new Error(`Failed to fetch monthly appointments: ${error.message}`);
        }

        return new Response(
          JSON.stringify({ success: true, data }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // Unknown action
      return new Response(
        JSON.stringify({ error: 'Invalid action parameter' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // POST: Create appointment (เหมือน API เดิม - logic ตรงกัน)
    if (req.method === 'POST') {
      const body = await req.json();

      // Remove fields that trigger will handle (เหมือน API เดิม)
      const { appointment_date_thai, created_at_thai, updated_at_thai, id, created_at, updated_at, ...appointmentData } = body;

      const { data, error } = await supabase
        .from("service_appointments")
        .insert(appointmentData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create appointment: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // PUT: Update appointment (เหมือน API เดิม - logic ตรงกัน)
    if (req.method === 'PUT') {
      const body = await req.json();
      const appointmentId = body.id;

      if (!appointmentId) {
        return new Response(
          JSON.stringify({ error: 'id is required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      // Remove fields that trigger will handle (เหมือน API เดิม)
      const { appointment_date_thai, created_at_thai, updated_at_thai, id, created_at, updated_at, ...updateData } = body.updates || body;

      const { data, error } = await supabase
        .from("service_appointments")
        .update(updateData)
        .eq("id", appointmentId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update appointment: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // DELETE: Delete appointment (เหมือน API เดิม - logic ตรงกัน)
    if (req.method === 'DELETE') {
      const appointmentId = queryParams.get('id');

      if (!appointmentId) {
        return new Response(
          JSON.stringify({ error: 'id is required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      const { error } = await supabase
        .from("service_appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) {
        throw new Error(`Failed to delete appointment: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ success: true }),
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
    console.error('[API] Service Appointments Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
