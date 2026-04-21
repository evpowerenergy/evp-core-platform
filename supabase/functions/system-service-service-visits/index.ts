/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// API สำหรับจัดการ Service Visits (เหมือน API เดิม - logic ตรงกัน)
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

    // Parse query parameters (เหมือน API เดิม)
    const url = new URL(req.url);
    const queryParams = url.searchParams;
    const action = queryParams.get('action');

    // GET: Fetch service visits (เหมือน API เดิม - logic ตรงกัน)
    if (req.method === 'GET') {
      // Get service visits for a specific customer (เหมือน API เดิม)
      if (action === 'byCustomer') {
        const customerId = queryParams.get('customerId');

        if (!customerId) {
          return new Response(
            JSON.stringify({ error: 'customerId is required' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }

        const { data, error } = await supabase
          .from("customer_services")
          .select("*")
          .eq("id", customerId)
          .maybeSingle();

        if (error) {
          throw new Error(`Failed to fetch service visits: ${error.message}`);
        }

        if (!data) {
          return new Response(
            JSON.stringify({ success: false, error: 'Customer not found' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404
            }
          );
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

        // Service visit 1 (เหมือน API เดิม)
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

        // Service visit 2 (เหมือน API เดิม)
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

        return new Response(
          JSON.stringify({ success: true, data: sortedVisits }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // Get upcoming service visits (next 7 days) (เหมือน API เดิม)
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

        return new Response(
          JSON.stringify({ success: true, data: upcomingVisits }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // Invalid action
      return new Response(
        JSON.stringify({ error: 'Invalid action parameter' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // POST: Create service visit (เหมือน API เดิม - logic ตรงกัน)
    if (req.method === 'POST') {
      const body = await req.json();
      const { customerId, visitNumber, visitDate, technician } = body;

      if (!customerId || !visitNumber || !visitDate || !technician) {
        return new Response(
          JSON.stringify({ error: 'customerId, visitNumber, visitDate, and technician are required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      // Calculate Thai time (UTC + 7) (เหมือน API เดิม)
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

      // If this is the second visit and both visits are completed, mark as completed (เหมือน API เดิม)
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

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // PUT: Update service visit (เหมือน API เดิม - logic ตรงกัน)
    if (req.method === 'PUT') {
      const body = await req.json();
      const { customerId, visitNumber, visitDate, technician } = body;

      if (!customerId || !visitNumber || !visitDate || !technician) {
        return new Response(
          JSON.stringify({ error: 'customerId, visitNumber, visitDate, and technician are required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      // Calculate Thai time (UTC + 7) (เหมือน API เดิม)
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

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // DELETE: Cancel service visit (เหมือน API เดิม - logic ตรงกัน)
    if (req.method === 'DELETE') {
      const customerId = queryParams.get('customerId');
      const visitNumber = queryParams.get('visitNumber');

      if (!customerId || !visitNumber) {
        return new Response(
          JSON.stringify({ error: 'customerId and visitNumber are required' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
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

      return new Response(
        JSON.stringify({ success: true, data }),
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
    console.error('[API] Service Visits Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
