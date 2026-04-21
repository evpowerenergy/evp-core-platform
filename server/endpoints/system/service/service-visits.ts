import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'http';

interface ExtendedIncomingMessage extends IncomingMessage {
  body?: any;
}

export default async function handler(req: ExtendedIncomingMessage, res: ServerResponse, env?: Record<string, string>) {
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

  try {
    // Parse query parameters
    const queryParams = new URLSearchParams(req.url?.split('?')[1] || '');
    const action = queryParams.get('action');

    // GET: Fetch service visits
    if (req.method === 'GET') {
      // Get service visits for a specific customer
      if (action === 'byCustomer') {
        const customerId = queryParams.get('customerId');

        if (!customerId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'customerId is required' }));
          return;
        }

        const { data, error } = await supabase
          .from("customer_services")
          .select("*")
          .eq("id", customerId)
          .single();

        if (error) {
          throw new Error(`Failed to fetch service visits: ${error.message}`);
        }

        const visits: Array<{
          id: number;
          customerId: number;
          visitNumber: 1 | 2;
          visitDate: string;
          visitDateThai: string;
          technician: string;
          completed: boolean;
        }> = [];

        // Service visit 1
        if (data.service_visit_1 && data.service_visit_1_date) {
          visits.push({
            id: data.id,
            customerId: data.id,
            visitNumber: 1,
            visitDate: data.service_visit_1_date,
            visitDateThai: data.service_visit_1_date_thai || data.service_visit_1_date,
            technician: data.service_visit_1_technician || "",
            completed: data.service_visit_1,
          });
        }

        // Service visit 2
        if (data.service_visit_2 && data.service_visit_2_date) {
          visits.push({
            id: data.id,
            customerId: data.id,
            visitNumber: 2,
            visitDate: data.service_visit_2_date,
            visitDateThai: data.service_visit_2_date_thai || data.service_visit_2_date,
            technician: data.service_visit_2_technician || "",
            completed: data.service_visit_2,
          });
        }

        const sortedVisits = visits.sort((a, b) => a.visitNumber - b.visitNumber);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: sortedVisits }));
        return;
      }

      // Get upcoming service visits (next 7 days)
      if (action === 'upcoming') {
        const { data, error } = await supabase
          .from("customer_services")
          .select("*")
          .or("service_visit_1.eq.false,service_visit_2.eq.false");

        if (error) {
          throw new Error(`Failed to fetch upcoming service visits: ${error.message}`);
        }

        const upcomingVisits: Array<{
          id: number;
          customerGroup: string;
          tel: string;
          province: string;
          district: string | null;
          pendingVisit1: boolean;
          pendingVisit2: boolean;
          installationDate: string | null;
        }> = [];

        data.forEach(item => {
          upcomingVisits.push({
            id: item.id,
            customerGroup: item.customer_group,
            tel: item.tel,
            province: item.province,
            district: item.district,
            pendingVisit1: !item.service_visit_1,
            pendingVisit2: item.service_visit_1 && !item.service_visit_2,
            installationDate: item.installation_date,
          });
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: upcomingVisits }));
        return;
      }

      // Invalid action
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid action parameter' }));
      return;
    }

    // POST: Create service visit
    if (req.method === 'POST') {
      const { customerId, visitNumber, visitDate, technician } = req.body;

      if (!customerId || !visitNumber || !visitDate || !technician) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'customerId, visitNumber, visitDate, and technician are required' }));
        return;
      }

      // Calculate Thai time (UTC + 7)
      const visitDateThai = new Date(visitDate);
      visitDateThai.setHours(visitDateThai.getHours() + 7);

      const updateData: any = {
        [`service_visit_${visitNumber}`]: true,
        [`service_visit_${visitNumber}_date`]: visitDate,
        [`service_visit_${visitNumber}_date_thai`]: visitDateThai.toISOString(),
        [`service_visit_${visitNumber}_technician`]: technician,
        updated_at: new Date().toISOString(),
        updated_at_thai: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      };

      // If this is the second visit and both visits are completed, mark as completed
      if (visitNumber === 2) {
        updateData.status = "completed";
      }

      const { data, error } = await supabase
        .from("customer_services")
        .update(updateData)
        .eq("id", customerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create service visit: ${error.message}`);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data }));
      return;
    }

    // PUT: Update service visit
    if (req.method === 'PUT') {
      const { customerId, visitNumber, visitDate, technician } = req.body;

      if (!customerId || !visitNumber || !visitDate || !technician) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'customerId, visitNumber, visitDate, and technician are required' }));
        return;
      }

      // Calculate Thai time (UTC + 7)
      const visitDateThai = new Date(visitDate);
      visitDateThai.setHours(visitDateThai.getHours() + 7);

      const updateData: any = {
        [`service_visit_${visitNumber}_date`]: visitDate,
        [`service_visit_${visitNumber}_date_thai`]: visitDateThai.toISOString(),
        [`service_visit_${visitNumber}_technician`]: technician,
        updated_at: new Date().toISOString(),
        updated_at_thai: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      };

      const { data, error } = await supabase
        .from("customer_services")
        .update(updateData)
        .eq("id", customerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update service visit: ${error.message}`);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data }));
      return;
    }

    // DELETE: Cancel service visit
    if (req.method === 'DELETE') {
      const customerId = queryParams.get('customerId');
      const visitNumber = queryParams.get('visitNumber');

      if (!customerId || !visitNumber) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'customerId and visitNumber are required' }));
        return;
      }

      const updateData: any = {
        [`service_visit_${visitNumber}`]: false,
        [`service_visit_${visitNumber}_date`]: null,
        [`service_visit_${visitNumber}_date_thai`]: null,
        [`service_visit_${visitNumber}_technician`]: null,
        updated_at: new Date().toISOString(),
        updated_at_thai: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
      };

      const { data, error } = await supabase
        .from("customer_services")
        .update(updateData)
        .eq("id", customerId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to cancel service visit: ${error.message}`);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data }));
      return;
    }

    // Method not allowed
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));

  } catch (error: any) {
    console.error('[API] Service Visits Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
  }
}

