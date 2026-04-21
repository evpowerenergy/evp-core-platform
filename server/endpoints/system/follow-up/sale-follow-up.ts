import { createClient } from '@supabase/supabase-js';

// Utility function to normalize phone numbers for comparison
const normalizePhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return "";
  return phone.replace(/[\s\-\(\)]/g, "").trim();
};

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
  const action = queryParams.get('action'); // list, detail, stats, provinces, sales

  try {
    if (req.method === 'GET') {
      
      // 1. Get completed service customers list (with filters)
      if (action === 'list' || !action) {
        const search = queryParams.get('search');
        const province = queryParams.get('province');
        const sale = queryParams.get('sale');
        const followUpStatus = queryParams.get('followUpStatus');
        const assignedTo = queryParams.get('assignedTo');

        // Step 1: Query customer services
        let query = supabase
          .from("customer_services_extended")
          .select(`
            *,
            assigned_sales_person:sales_team_with_user_info!sale_follow_up_assigned_to(
              id,
              name
            )
          `)
          .eq("completed_visits_count", 2);

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

        if (followUpStatus && followUpStatus !== "all") {
          query = query.eq("sale_follow_up_status", followUpStatus);
        }

        if (assignedTo) {
          query = query.eq("sale_follow_up_assigned_to", parseInt(assignedTo));
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch completed service customers: ${error.message}`);
        }

        // Step 2: Get all phone numbers and create normalized mapping
        const phoneMapping = new Map<string, string>();
        data?.forEach(customer => {
          if (customer.tel) {
            const normalized = normalizePhoneNumber(customer.tel);
            if (normalized) {
              phoneMapping.set(normalized, customer.tel);
            }
          }
        });

        // Step 3: Query ALL leads matching these phone numbers
        let allLeads: any[] = [];
        if (phoneMapping.size > 0) {
          const allPhones = [...new Set([...Array.from(phoneMapping.values())])];

          const { data: leadsData } = await supabase
            .from("leads")
            .select("tel, status, operation_status, id, created_at, full_name")
            .in("tel", allPhones)
            .order("created_at", { ascending: false });
          
          allLeads = leadsData || [];
        }

        // Step 4: Create lookup map with normalized phone numbers
        const leadsMap = new Map<string, any>();
        allLeads.forEach(lead => {
          const normalized = normalizePhoneNumber(lead.tel);
          if (normalized && !leadsMap.has(normalized)) {
            leadsMap.set(normalized, lead);
          }
        });

        // Step 5: Merge data
        const customersWithRepeatSale = (data || []).map(customer => {
          const normalizedTel = normalizePhoneNumber(customer.tel);
          const leadInfo = leadsMap.get(normalizedTel);
          
          return {
            ...customer,
            has_lead: !!leadInfo,
            lead_info: leadInfo || null,
            has_repeat_sale: leadInfo?.status === "ปิดการขาย",
            repeat_sale_info: leadInfo?.status === "ปิดการขาย" ? leadInfo : null,
          };
        });

        // Step 6: Sort by days_after_service_complete (descending)
        const sortedData = customersWithRepeatSale.sort((a, b) => {
          const daysA = a.days_after_service_complete;
          const daysB = b.days_after_service_complete;
          
          if (daysA === null || daysA === undefined) return 1;
          if (daysB === null || daysB === undefined) return -1;
          
          return daysB - daysA;
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: sortedData }));
        return;
      }

      // 2. Get customer detail
      if (action === 'detail') {
        const customerId = queryParams.get('customerId');
        
        if (!customerId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'customerId is required' }));
          return;
        }

        // Step 1: Get customer service detail
        const { data: customer, error } = await supabase
          .from("customer_services_extended")
          .select(`
            *,
            assigned_sales_person:sales_team_with_user_info!sale_follow_up_assigned_to(
              id,
              name
            )
          `)
          .eq("id", customerId)
          .single();

        if (error) {
          throw new Error(`Failed to fetch customer detail: ${error.message}`);
        }

        if (!customer) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Customer not found' }));
          return;
        }

        // Step 2: Check for leads matching this customer's phone
        const normalizedTel = normalizePhoneNumber(customer.tel);
        let leadInfo: any = null;

        if (normalizedTel && customer.tel) {
          const { data: leadsData } = await supabase
            .from("leads")
            .select("tel, status, operation_status, id, created_at, full_name")
            .eq("tel", customer.tel)
            .order("created_at", { ascending: false })
            .limit(1);

          if (leadsData && leadsData.length > 0) {
            leadInfo = leadsData[0];
          }
        }

        // Step 3: Get service visit history
        const { data: serviceVisits } = await supabase
          .from("service_appointments")
          .select("*")
          .eq("customer_service_id", customerId)
          .order("appointment_date", { ascending: false });

        const result = {
          ...customer,
          has_lead: !!leadInfo,
          lead_info: leadInfo || null,
          service_visits: serviceVisits || [],
          has_repeat_sale: leadInfo?.status === "ปิดการขาย",
          repeat_sale_info: leadInfo?.status === "ปิดการขาย" ? leadInfo : null,
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: result }));
        return;
      }

      // 3. Get statistics
      if (action === 'stats') {
        const { data, error } = await supabase
          .from("customer_services_extended")
          .select("sale_follow_up_status, sale_follow_up_date, sale_follow_up_required")
          .eq("service_visit_1", true)
          .eq("service_visit_2", true);

        if (error) {
          throw new Error(`Failed to fetch sale follow-up stats: ${error.message}`);
        }

        const stats = {
          total_completed_services: data.length,
          pending_follow_up: data.filter(item => item.sale_follow_up_status === "pending").length,
          completed_follow_up: data.filter(item => item.sale_follow_up_status === "completed").length,
          cancelled_follow_up: data.filter(item => item.sale_follow_up_status === "cancelled").length,
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: stats }));
        return;
      }

      // 4. Get provinces for filtering
      if (action === 'provinces') {
        const { data, error } = await supabase
          .from("customer_services_extended")
          .select("province")
          .eq("service_visit_1", true)
          .eq("service_visit_2", true)
          .not("province", "is", null);

        if (error) {
          throw new Error(`Failed to fetch provinces: ${error.message}`);
        }

        const uniqueProvinces = Array.from(
          new Set(data.map(item => item.province).filter(Boolean))
        ).sort();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: uniqueProvinces }));
        return;
      }

      // 5. Get sales persons for filtering
      if (action === 'sales') {
        const { data, error } = await supabase
          .from("customer_services_extended")
          .select("sale")
          .eq("service_visit_1", true)
          .eq("service_visit_2", true)
          .not("sale", "is", null);

        if (error) {
          throw new Error(`Failed to fetch sales persons: ${error.message}`);
        }

        const uniqueSales = Array.from(
          new Set(data.map(item => item.sale).filter(Boolean))
        ).sort();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: uniqueSales }));
        return;
      }

      // 6. Get sales team members
      if (action === 'team') {
        const { data, error } = await supabase
          .from("sales_team_with_user_info")
          .select("id, name")
          .eq("status", "active")
          .order("name");

        if (error) {
          throw new Error(`Failed to fetch sales team members: ${error.message}`);
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

    // POST: Mutations (create, update, cancel)
    if (req.method === 'POST') {
      const body = req.body;
      const mutationAction = body.action;

      // 1. Create sale follow-up
      if (mutationAction === 'create') {
        const { customerId, followUpData } = body;

        if (!customerId || !followUpData) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'customerId and followUpData are required' }));
          return;
        }

        // Calculate Thai time (UTC + 7)
        const followUpDateThai = new Date(followUpData.sale_follow_up_date);
        followUpDateThai.setHours(followUpDateThai.getHours() + 7);

        const updateData = {
          sale_follow_up_required: true,
          sale_follow_up_date: followUpData.sale_follow_up_date,
          sale_follow_up_date_thai: followUpDateThai.toISOString(),
          sale_follow_up_details: followUpData.sale_follow_up_details,
          sale_follow_up_notes: "",
          sale_follow_up_assigned_to: followUpData.sale_follow_up_assigned_to,
          sale_follow_up_status: followUpData.sale_follow_up_status || "pending",
          sale_follow_up_created_at: new Date().toISOString(),
          sale_follow_up_updated_at: new Date().toISOString(),
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
          throw new Error(`Failed to create sale follow-up: ${error.message}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data }));
        return;
      }

      // 2. Update sale follow-up
      if (mutationAction === 'update') {
        const { customerId, followUpData } = body;

        if (!customerId || !followUpData) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'customerId and followUpData are required' }));
          return;
        }

        const updateData: any = {
          ...followUpData,
          sale_follow_up_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          updated_at_thai: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
        };

        // Recalculate Thai time if date is being updated
        if (followUpData.sale_follow_up_date) {
          const followUpDateThai = new Date(followUpData.sale_follow_up_date);
          followUpDateThai.setHours(followUpDateThai.getHours() + 7);
          updateData.sale_follow_up_date_thai = followUpDateThai.toISOString();
        }

        const { data, error } = await supabase
          .from("customer_services")
          .update(updateData)
          .eq("id", customerId)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to update sale follow-up: ${error.message}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data }));
        return;
      }

      // 3. Cancel sale follow-up
      if (mutationAction === 'cancel') {
        const { customerId } = body;

        if (!customerId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'customerId is required' }));
          return;
        }

        const updateData = {
          sale_follow_up_status: "cancelled",
          sale_follow_up_updated_at: new Date().toISOString(),
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
          throw new Error(`Failed to cancel sale follow-up: ${error.message}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data }));
        return;
      }

      // 4. Update customer service
      if (mutationAction === 'updateCustomer') {
        const { customerId, customerData } = body;

        if (!customerId || !customerData) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'customerId and customerData are required' }));
          return;
        }

        const updateData = {
          ...customerData,
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
          throw new Error(`Failed to update customer service: ${error.message}`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data }));
        return;
      }

      // Unknown mutation action
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid mutation action' }));
      return;
    }

    // Method not allowed
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));

  } catch (error: any) {
    console.error('[API] Sale Follow-Up Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message || 'Internal server error' }));
  }
}

