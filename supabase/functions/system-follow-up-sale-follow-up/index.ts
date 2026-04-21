/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Utility function to normalize phone numbers for comparison (เหมือน API เดิม)
const normalizePhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return "";
  return phone.replace(/[\s\-\(\)]/g, "").trim();
};

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    // Parse query parameters from URL (เหมือน API เดิม)
    const url = new URL(req.url);
    const queryParams = url.searchParams;
    const action = queryParams.get('action'); // list, detail, stats, provinces, sales, team

    if (req.method === 'GET') {
      
      // 1. Get completed service customers list (with filters) - action=list หรือไม่ระบุ action
      if (action === 'list' || !action) {
        const search = queryParams.get('search');
        const province = queryParams.get('province');
        const sale = queryParams.get('sale');
        const followUpStatus = queryParams.get('followUpStatus');
        const assignedTo = queryParams.get('assignedTo');

        // Step 1: Query customer services (เหมือน API เดิม)
        let query = supabase
          .from("customer_services_extended")
          .select(`
            *,
            assigned_sales_person:sales_team_with_user_info!sale_follow_up_assigned_to(
              id,
              name
            )
          `)
          .gte("completed_visits_count", 2);

        // Apply filters (เหมือน API เดิม)
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

        // Step 2: Get all phone numbers and create normalized mapping (เหมือน API เดิม)
        const phoneMapping = new Map<string, string>();
        data?.forEach(customer => {
          if (customer.tel) {
            const normalized = normalizePhoneNumber(customer.tel);
            if (normalized) {
              phoneMapping.set(normalized, customer.tel);
            }
          }
        });

        // Step 3: Query ALL leads matching these phone numbers (เหมือน API เดิม)
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

        // Step 4: Create lookup map with normalized phone numbers (เหมือน API เดิม)
        const leadsMap = new Map<string, any>();
        allLeads.forEach(lead => {
          const normalized = normalizePhoneNumber(lead.tel);
          if (normalized && !leadsMap.has(normalized)) {
            leadsMap.set(normalized, lead);
          }
        });

        // Step 5: Merge data (เหมือน API เดิม)
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

        // Step 6: Sort by days_after_service_complete (descending) (เหมือน API เดิม)
        const sortedData = customersWithRepeatSale.sort((a, b) => {
          const daysA = a.days_after_service_complete;
          const daysB = b.days_after_service_complete;
          
          if (daysA === null || daysA === undefined) return 1;
          if (daysB === null || daysB === undefined) return -1;
          
          return daysB - daysA;
        });

        return new Response(
          JSON.stringify({ success: true, data: sortedData }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // 2. Get customer detail (เหมือน API เดิม)
      if (action === 'detail') {
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

        // Step 1: Get customer service detail (เหมือน API เดิม)
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
          .maybeSingle();

        if (error) {
          throw new Error(`Failed to fetch customer detail: ${error.message}`);
        }

        if (!customer) {
          return new Response(
            JSON.stringify({ error: 'Customer not found' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404
            }
          );
        }

        // Step 2: Check for leads matching this customer's phone (เหมือน API เดิม)
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

        // Step 3: Get service visit history (เหมือน API เดิม)
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

        return new Response(
          JSON.stringify({ success: true, data: result }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // 3. Get statistics (เหมือน API เดิม)
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

        return new Response(
          JSON.stringify({ success: true, data: stats }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // 4. Get provinces for filtering (เหมือน API เดิม)
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

        return new Response(
          JSON.stringify({ success: true, data: uniqueProvinces }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // 5. Get sales persons for filtering (เหมือน API เดิม)
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

        return new Response(
          JSON.stringify({ success: true, data: uniqueSales }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // 6. Get sales team members (เหมือน API เดิม)
      if (action === 'team') {
        const { data, error } = await supabase
          .from("sales_team_with_user_info")
          .select("id, name")
          .eq("status", "active")
          .order("name");

        if (error) {
          throw new Error(`Failed to fetch sales team members: ${error.message}`);
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

    // POST: Mutations (create, update, cancel, updateCustomer) (เหมือน API เดิม)
    if (req.method === 'POST') {
      const body = await req.json();
      const mutationAction = body.action;

      // 1. Create sale follow-up (เหมือน API เดิม)
      if (mutationAction === 'create') {
        const { customerId, followUpData } = body;

        if (!customerId || !followUpData) {
          return new Response(
            JSON.stringify({ error: 'customerId and followUpData are required' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }

        // Calculate Thai time (UTC + 7) (เหมือน API เดิม)
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

        return new Response(
          JSON.stringify({ success: true, data }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // 2. Update sale follow-up (เหมือน API เดิม)
      if (mutationAction === 'update') {
        const { customerId, followUpData } = body;

        if (!customerId || !followUpData) {
          return new Response(
            JSON.stringify({ error: 'customerId and followUpData are required' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
        }

        const updateData: any = {
          ...followUpData,
          sale_follow_up_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          updated_at_thai: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
        };

        // Recalculate Thai time if date is being updated (เหมือน API เดิม)
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

        return new Response(
          JSON.stringify({ success: true, data }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // 3. Cancel sale follow-up (เหมือน API เดิม)
      if (mutationAction === 'cancel') {
        const { customerId } = body;

        if (!customerId) {
          return new Response(
            JSON.stringify({ error: 'customerId is required' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
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

        return new Response(
          JSON.stringify({ success: true, data }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // 4. Update customer service (เหมือน API เดิม)
      if (mutationAction === 'updateCustomer') {
        const { customerId, customerData } = body;

        if (!customerId || !customerData) {
          return new Response(
            JSON.stringify({ error: 'customerId and customerData are required' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );
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

        return new Response(
          JSON.stringify({ success: true, data }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }

      // Unknown mutation action
      return new Response(
        JSON.stringify({ error: 'Invalid mutation action' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
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
    console.error('[API] Sale Follow-Up Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
