import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any, env?: Record<string, string>) {
  // ✅ 1. Accept env parameter for Vite compatibility
  const supabaseUrl = env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Supabase configuration missing' }));
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
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

    // ✅ 2. Use native response API
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: stats,
      meta: {
        executionTime: `${executionTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
        totalServices: servicesData.length
      }
    }));

  } catch (error: any) {
    console.error('Customer Service Stats API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }));
  }
}