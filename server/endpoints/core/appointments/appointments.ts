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
    const salesMemberId = queryParams.get('salesMemberId');

    if (!salesMemberId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Sales member ID is required'
      }));
      return;
    }

    // Performance monitoring
    const startTime = performance.now();

    // Get productivity logs for this sales member first
    // ✅ ใช้ sale_id แทน lead.sale_owner_id เพื่อเพิ่ม performance (Filter จาก index ก่อน → Join หลัง)
    const { data: productivityLogs, error: logsError } = await supabase
      .from('lead_productivity_logs')
      .select(`
        id,
        sale_id,
        next_follow_up,
        next_follow_up_details,
        created_at,
        lead_id,
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
      .neq('lead.operation_status', 'ปิดการขายแล้ว')
      .neq('lead.operation_status', 'ปิดการขายไม่สำเร็จ')
      .order('created_at', { ascending: false });

    if (logsError) {
      throw new Error(`Failed to fetch productivity logs: ${logsError.message}`);
    }

    // Group logs by lead_id to get only the latest log for each lead
    const latestLogsByLead = new Map();
    productivityLogs?.forEach(log => {
      const leadId = log.lead_id;
      if (!latestLogsByLead.has(leadId) || 
          new Date(log.created_at) > new Date(latestLogsByLead.get(leadId).created_at)) {
        latestLogsByLead.set(leadId, log);
      }
    });

    const latestLogs = Array.from(latestLogsByLead.values());
    const logIds = latestLogs.map(log => log.id);

    // Fetch all appointments in parallel - ใช้ข้อมูลจาก appointments table เท่านั้น
    const [engineerData, followUpData, paymentData] = await Promise.all([
      // Engineer appointments - กรองตาม appointment_type
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

      // Follow-up appointments from appointments table - กรองตาม appointment_type
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

    // Process follow-up appointments - ใช้ข้อมูลจาก appointments table เท่านั้น
    const followUp = (followUpData.data || []).map(item => {
      const relatedLog = latestLogs?.find(log => log.id === item.productivity_log_id);
      return {
        id: item.id,
        date: item.date,
        type: 'follow-up',
        details: item.note,
        lead: relatedLog?.lead || { id: 0, full_name: 'Unknown' },
        source: 'appointment'
      };
    });

    // Process engineer appointments
    const engineer = (engineerData.data || []).map(item => {
      const relatedLog = latestLogs?.find(log => log.id === item.productivity_log_id);
      return {
        id: item.id,
        date: item.date,
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

    // Process payment appointments
    const payment = (paymentData.data || []).map(item => {
      const relatedLog = latestLogs?.find(log => log.id === item.productivity_log_id);
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

    // ✅ 3. Use native response API
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
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
    }));

  } catch (error: any) {
    console.error('Appointments API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }));
  }
}
