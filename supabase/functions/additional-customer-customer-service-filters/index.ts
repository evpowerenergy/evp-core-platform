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
    // Initialize Supabase client with environment variables (เหมือน API เดิม - ใช้ SERVICE_ROLE_KEY)
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
    const filterType = queryParams.get('filterType');

    if (!filterType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'filterType is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Performance monitoring
    const startTime = performance.now();

    let result: any = null;

    switch (filterType) {
      case 'provinces':
        // Get unique provinces (เหมือน useCustomerServiceProvinces)
        const { data: provincesData, error: provincesError } = await supabase
          .from("customer_services_extended")
          .select("province")
          .not("province", "is", null);

        if (provincesError) {
          throw new Error(`Failed to fetch provinces: ${provincesError.message}`);
        }

        const uniqueProvinces = [...new Set(provincesData.map(item => item.province))].filter(Boolean);
        result = uniqueProvinces.sort();
        break;

      case 'installers':
        // Get unique installer names (เหมือน useCustomerServiceInstallers)
        const { data: installersData, error: installersError } = await supabase
          .from("customer_services_extended")
          .select("installer_name")
          .not("installer_name", "is", null);

        if (installersError) {
          throw new Error(`Failed to fetch installers: ${installersError.message}`);
        }

        const uniqueInstallers = [...new Set(installersData.map(item => item.installer_name))].filter(Boolean);
        result = uniqueInstallers.sort();
        break;

      case 'sales':
        // Get unique sales teams (เหมือน useCustomerServiceSales)
        const { data: salesData, error: salesError } = await supabase
          .from("customer_services_extended")
          .select("sale")
          .not("sale", "is", null);

        if (salesError) {
          throw new Error(`Failed to fetch sales: ${salesError.message}`);
        }

        const uniqueSales = [...new Set(salesData.map(item => item.sale))].filter(Boolean);
        result = uniqueSales.sort();
        break;

      case 'technicians':
        // Get unique technicians (เหมือน useCustomerServiceTechnicians)
        const { data: techniciansData, error: techniciansError } = await supabase
          .from("customer_services_extended")
          .select("service_visit_1_technician, service_visit_2_technician, service_visit_3_technician, service_visit_4_technician, service_visit_5_technician");

        if (techniciansError) {
          throw new Error(`Failed to fetch technicians: ${techniciansError.message}`);
        }

        const technicians = new Set<string>();
        techniciansData.forEach(item => {
          if (item.service_visit_1_technician) technicians.add(item.service_visit_1_technician);
          if (item.service_visit_2_technician) technicians.add(item.service_visit_2_technician);
          if (item.service_visit_3_technician) technicians.add(item.service_visit_3_technician);
          if (item.service_visit_4_technician) technicians.add(item.service_visit_4_technician);
          if (item.service_visit_5_technician) technicians.add(item.service_visit_5_technician);
        });

        result = Array.from(technicians).sort();
        break;

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid filterType. Supported types: provinces, installers, sales, technicians'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        meta: {
          executionTime: `${executionTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
          filterType,
          totalItems: result.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Customer Service Filters API Error:', error);
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
