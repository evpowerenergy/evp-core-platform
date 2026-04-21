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

    // Performance monitoring
    const startTime = performance.now();

    // Get customer service statistics (เหมือน useCustomerServiceStats)
    const { data: servicesData, error: servicesError } = await supabase
      .from("customer_services_extended")
      .select("service_visit_1, service_visit_2, service_visit_3, service_visit_4, service_visit_5, completed_visits_count");

    if (servicesError) {
      throw new Error(`Failed to fetch customer service stats: ${servicesError.message}`);
    }

    // Calculate statistics
    const stats = {
      total: servicesData.length,
      completed: servicesData.filter(item => item.completed_visits_count >= 2).length,
      serviceVisit1Completed: servicesData.filter(item => item.service_visit_1 === true).length,
      serviceVisit2Completed: servicesData.filter(item => item.service_visit_2 === true).length,
      serviceVisit3Completed: servicesData.filter(item => item.service_visit_3 === true).length,
      serviceVisit4Completed: servicesData.filter(item => item.service_visit_4 === true).length,
      serviceVisit5Completed: servicesData.filter(item => item.service_visit_5 === true).length,
      pendingServiceVisit1: servicesData.filter(item => item.service_visit_1 === false).length,
      pendingServiceVisit2: servicesData.filter(item => item.service_visit_1 === true && item.service_visit_2 === false).length,
      pendingServiceVisit3: servicesData.filter(item => item.service_visit_2 === true && item.service_visit_3 === false).length,
      pendingServiceVisit4: servicesData.filter(item => item.service_visit_3 === true && item.service_visit_4 === false).length,
      pendingServiceVisit5: servicesData.filter(item => item.service_visit_4 === true && item.service_visit_5 === false).length,
    };

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: stats,
        meta: {
          executionTime: `${executionTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
          totalServices: servicesData.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Customer Service Stats API Error:', error);
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
