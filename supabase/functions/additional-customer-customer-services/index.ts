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
    
    const search = queryParams.get('search');
    const province = queryParams.get('province');
    const sale = queryParams.get('sale');
    const installerName = queryParams.get('installerName');
    const serviceVisit1 = queryParams.get('serviceVisit1');
    const serviceVisit2 = queryParams.get('serviceVisit2');
    const serviceVisit3 = queryParams.get('serviceVisit3');
    const serviceVisit4 = queryParams.get('serviceVisit4');
    const serviceVisit5 = queryParams.get('serviceVisit5');
    const id = queryParams.get('id');

    // Performance monitoring
    const startTime = performance.now();

    let result: any = null;

    if (id) {
      // Get single customer service (เหมือน useCustomerService)
      const { data: customerService, error: serviceError } = await supabase
        .from("customer_services_extended")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (serviceError) {
        throw new Error(`Failed to fetch customer service: ${serviceError.message}`);
      }

      if (!customerService) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Customer service not found'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404
          }
        );
      }

      result = customerService;
    } else {
      // Get customer services with filters (เหมือน useCustomerServices)
      let query = supabase
        .from("customer_services_extended")
        .select("*")
        .order("id", { ascending: true });

      // Apply filters
      if (search) {
        query = query.or(
          `customer_group.ilike.%${search}%,tel.ilike.%${search}%,installer_name.ilike.%${search}%`
        );
      }

      if (province && province !== "all") {
        query = query.eq("province", province);
      }

      if (sale && sale !== "all") {
        query = query.eq("sale", sale);
      }

      if (installerName && installerName !== "all") {
        query = query.eq("installer_name", installerName);
      }

      if (serviceVisit1 !== null && serviceVisit1 !== undefined) {
        query = query.eq("service_visit_1", serviceVisit1 === 'true');
      }

      if (serviceVisit2 !== null && serviceVisit2 !== undefined) {
        query = query.eq("service_visit_2", serviceVisit2 === 'true');
      }

      if (serviceVisit3 !== null && serviceVisit3 !== undefined) {
        query = query.eq("service_visit_3", serviceVisit3 === 'true');
      }

      if (serviceVisit4 !== null && serviceVisit4 !== undefined) {
        query = query.eq("service_visit_4", serviceVisit4 === 'true');
      }

      if (serviceVisit5 !== null && serviceVisit5 !== undefined) {
        query = query.eq("service_visit_5", serviceVisit5 === 'true');
      }

      const { data: customerServices, error: servicesError } = await query;

      if (servicesError) {
        throw new Error(`Failed to fetch customer services: ${servicesError.message}`);
      }

      result = customerServices || [];
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
          isDetail: !!id,
          totalServices: Array.isArray(result) ? result.length : 1
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Customer Services API Error:', error);
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
