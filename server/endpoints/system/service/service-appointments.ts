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

  try {
    // GET: Query appointments
    if (req.method === 'GET') {
      const action = queryParams.get('action');

      // 1. Get all appointments with filters
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

        // Filter by specific date
        if (date) {
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);
          
          query = query
            .gte("appointment_date", startOfDay.toISOString())
            .lte("appointment_date", endOfDay.toISOString());
        }

        // Filter by date range
        if (startDate && endDate) {
          const startOfDay = new Date(startDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          query = query
            .gte("appointment_date", startOfDay.toISOString())
            .lte("appointment_date", endOfDay.toISOString());
        }

        // Filter by technician
        if (technician) {
          query = query.eq("technician_name", technician);
        }

        // Filter by status
        if (status) {
          query = query.eq("status", status);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch appointments: ${error.message}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data }));
        return;
      }

      // 2. Get monthly appointments (for calendar)
      if (action === 'monthly') {
        const year = queryParams.get('year');
        const month = queryParams.get('month');

        if (!year || !month) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'year and month are required' }));
          return;
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

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data }));
        return;
      }

      // Unknown action
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid action parameter' }));
      return;
    }

    // POST: Create appointment
    if (req.method === 'POST') {
      const body = req.body;

      // Remove fields that trigger will handle
      const { appointment_date_thai, created_at_thai, updated_at_thai, id, created_at, updated_at, ...appointmentData } = body;

      const { data, error } = await supabase
        .from("service_appointments")
        .insert(appointmentData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create appointment: ${error.message}`);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data }));
      return;
    }

    // PUT: Update appointment
    if (req.method === 'PUT') {
      const body = req.body;
      const appointmentId = body.id;

      if (!appointmentId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'id is required' }));
        return;
      }

      // Remove fields that trigger will handle
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

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data }));
      return;
    }

    // DELETE: Delete appointment
    if (req.method === 'DELETE') {
      const appointmentId = queryParams.get('id');

      if (!appointmentId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'id is required' }));
        return;
      }

      const { error } = await supabase
        .from("service_appointments")
        .delete()
        .eq("id", appointmentId);

      if (error) {
        throw new Error(`Failed to delete appointment: ${error.message}`);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // Method not allowed
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));

  } catch (error: any) {
    console.error('[API] Service Appointments Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
  }
}

