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
    // ✅ 2. Parse query parameters from URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const queryParams = url.searchParams;
    const filterType = queryParams.get('filterType');

    if (!filterType) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'filterType is required'
      }));
      return;
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
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid filterType. Supported types: provinces, installers, sales, technicians'
        }));
        return;
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // ✅ 3. Use native response API
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: result,
      meta: {
        executionTime: `${executionTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
        filterType,
        totalItems: result.length
      }
    }));

  } catch (error: any) {
    console.error('Customer Service Filters API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }));
  }
}