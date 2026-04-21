/// <reference path="./deno.d.ts" />
// @ts-ignore - URL import is supported by Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  'Access-Control-Max-Age': '86400', // 24 hours
};

Deno.serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405
      }
    );
  }

  try {
    // Initialize Supabase client with environment variables (เหมือน API เดิม)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('[API] Missing Supabase credentials');
      return new Response(
        JSON.stringify({ success: false, error: 'Supabase configuration missing' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Create Supabase client (ใช้ SERVICE_ROLE_KEY เพื่อ bypass RLS เหมือน API เดิม)
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse query parameters from URL
    const url = new URL(req.url);
    const queryParams = url.searchParams;
    const salesMemberId = queryParams.get('salesMemberId');

    if (!salesMemberId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Sales member ID is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Performance monitoring
    const startTime = performance.now();

    // ✅ วิธีที่ 1: Query productivity_logs ก่อน (ไม่ filter operation_status) → query appointments → join กับ leads
    // ข้อดี: ได้ appointments ของ leads ที่ปิดการขายแล้วด้วย (ไม่ filter operation_status)
    
    // Step 1: Query productivity_logs ทั้งหมด (ไม่ filter operation_status) เพื่อ filter sale_id
    const { data: allProductivityLogs, error: allLogsError } = await supabase
      .from('lead_productivity_logs')
      .select(`
        id,
        sale_id,
        lead_id,
        created_at,
        lead:leads(
          id,
          full_name,
          tel,
          region,
          platform,
          category,
          operation_status
        )
      `)
      .eq('sale_id', salesMemberId)
      .order('created_at', { ascending: false });

    if (allLogsError) {
      throw new Error(`Failed to fetch productivity logs: ${allLogsError.message}`);
    }

    // Group logs by lead_id to get only the latest log for each lead
    const latestLogsByLead = new Map();
    allProductivityLogs?.forEach((log: any) => {
      const leadId = log.lead_id;
      if (!latestLogsByLead.has(leadId) || 
          new Date(log.created_at) > new Date(latestLogsByLead.get(leadId).created_at)) {
        latestLogsByLead.set(leadId, log);
      }
    });

    const latestLogs = Array.from(latestLogsByLead.values());
    const logIds = latestLogs.map((log: any) => log.id);

    // Step 2: Query appointments โดยใช้ logIds (ไม่ filter operation_status)
    const [engineerData, followUpData, paymentData] = await Promise.all([
      // Engineer appointments
      logIds.length > 0 ? supabase
        .from('appointments')
        .select(`
          id,
          date,
          date_thai,
          location,
          building_details,
          installation_notes,
          status,
          note,
          appointment_type,
          productivity_log_id
        `)
        .in('productivity_log_id', logIds)
        .eq('appointment_type', 'engineer')
        .not('date', 'is', null)
        .order('date', { ascending: true }) : Promise.resolve({ data: [], error: null }),

      // Follow-up appointments
      logIds.length > 0 ? supabase
        .from('appointments')
        .select(`
          id,
          date,
          date_thai,
          status,
          note,
          appointment_type,
          productivity_log_id
        `)
        .in('productivity_log_id', logIds)
        .eq('appointment_type', 'follow-up')
        .not('date', 'is', null)
        .order('date', { ascending: true }) : Promise.resolve({ data: [], error: null }),

      // Payment appointments
      logIds.length > 0 ? supabase
        .from('quotations')
        .select(`
          id,
          estimate_payment_date,
          total_amount,
          payment_method,
          productivity_log_id
        `)
        .in('productivity_log_id', logIds)
        .not('estimate_payment_date', 'is', null)
        .order('estimate_payment_date', { ascending: true }) : Promise.resolve({ data: [], error: null })
    ]);

    // Check for errors
    if (engineerData.error) {
      throw new Error(`Failed to fetch engineer appointments: ${engineerData.error.message}`);
    }
    if (followUpData.error) {
      throw new Error(`Failed to fetch follow-up appointments: ${followUpData.error.message}`);
    }
    if (paymentData.error) {
      throw new Error(`Failed to fetch payment appointments: ${paymentData.error.message}`);
    }

    // Process follow-up appointments - map กับ latestLogs เพื่อได้ lead info
    const followUp = (followUpData.data || []).map((item: any) => {
      const relatedLog = latestLogs?.find((log: any) => log.id === item.productivity_log_id);
      return {
        id: item.id,
        date: item.date,
        date_thai: item.date_thai,
        type: 'follow-up',
        details: item.note,
        lead: relatedLog?.lead || { id: 0, full_name: 'Unknown' },
        source: 'appointment'
      };
    });

    // Process engineer appointments - map กับ latestLogs เพื่อได้ lead info
    const engineer = (engineerData.data || []).map((item: any) => {
      const relatedLog = latestLogs?.find((log: any) => log.id === item.productivity_log_id);
      return {
        id: item.id,
        date: item.date,
        date_thai: item.date_thai,
        location: item.location,
        building_details: item.building_details,
        installation_notes: item.installation_notes,
        status: item.status || 'scheduled',
        note: item.note,
        type: 'engineer',
        lead: relatedLog?.lead || { id: 0, full_name: 'Unknown' },
        source: 'appointment'
      };
    });

    // Process payment appointments - map กับ latestLogs เพื่อได้ lead info
    const payment = (paymentData.data || []).map((item: any) => {
      const relatedLog = latestLogs?.find((log: any) => log.id === item.productivity_log_id);
      return {
        id: item.id,
        date: item.estimate_payment_date,
        total_amount: item.total_amount,
        payment_method: item.payment_method,
        type: 'payment',
        lead: relatedLog?.lead || { id: 0, full_name: 'Unknown' },
        source: 'quotation'
      };
    });

    const result = { followUp, engineer, payment };

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        meta: {
          executionTime: `${executionTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
          salesMemberId,
          totalAppointments: followUp.length + engineer.length + payment.length,
          followUpCount: followUp.length,
          engineerCount: engineer.length,
          paymentCount: payment.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Appointments API Error:', error);
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
