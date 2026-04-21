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
    // Initialize Supabase client with environment variables (เหมือน API เดิม - ใช้ SERVICE_ROLE_KEY หรือ ANON_KEY)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('VITE_SUPABASE_ANON_KEY');

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

    // Get sales team data using the table (no longer a view)
    const { data: salesTeam, error: salesTeamError } = await supabase
      .from('sales_team_with_user_info')
      .select('id, name, email, status, current_leads');

    if (salesTeamError) throw salesTeamError;
    if (!salesTeam?.length) {
      const executionTime = performance.now() - startTime;
      return new Response(
        JSON.stringify({
          success: true,
          data: [],
          stats: {
            totalMembers: 0,
            activeMembers: 0,
            totalLeads: 0,
            averageLeadsPerMember: 0
          },
          meta: {
            executionTime: `${executionTime.toFixed(2)}ms`,
            timestamp: new Date().toISOString()
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Get all leads data for all sales members in one optimized query
    // รวมทั้ง sale_owner_id และ post_sales_owner_id สำหรับ current_leads และ conversion rate
    const salesOwnerIds = salesTeam.map(member => member.id);
    
    // Build OR condition for sale_owner_id and post_sales_owner_id
    const saleOwnerIdsStr = salesOwnerIds.join(',');
    const orCondition = `sale_owner_id.in.(${saleOwnerIdsStr}),post_sales_owner_id.in.(${saleOwnerIdsStr})`;
    
    // Query leads with better optimization - รวม post_sales_owner_id
    // ✅ ใช้ has_contact_info computed column เพื่อกรองเฉพาะลีดที่มีข้อมูลติดต่อ
    const { data: allLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, sale_owner_id, post_sales_owner_id, status')
      .or(orCondition)
      .eq('has_contact_info', true) // ✅ กรองเฉพาะลีดที่มีข้อมูลติดต่อ
      .in('status', ['กำลังติดตาม', 'ปิดการขาย']); // Filter only relevant statuses

    if (leadsError) throw leadsError;

    // Get ALL leads data for conversion rate calculation (including all statuses)
    // รวมทั้ง sale_owner_id และ post_sales_owner_id
    // ✅ ใช้ has_contact_info computed column เพื่อกรองเฉพาะลีดที่มีข้อมูลติดต่อ
    const { data: allLeadsForConversion, error: allLeadsError } = await supabase
      .from('leads')
      .select('id, sale_owner_id, post_sales_owner_id, status, tel, line_id')
      .or(orCondition)
      .eq('has_contact_info', true); // ✅ กรองเฉพาะลีดที่มีข้อมูลติดต่อ

    if (allLeadsError) throw allLeadsError;

    // ✅ ใช้ sale_id จาก productivity logs แทน sale_owner_id จาก leads สำหรับการคำนวณยอดขาย
    // Query productivity logs ที่ status = 'ปิดการขายแล้ว' โดยใช้ sale_id
    let productivityLogs: any[] = [];

    // Query productivity logs ที่ status = 'ปิดการขายแล้ว' และ sale_id ใน salesOwnerIds
    const { data: logs, error: logsError } = await supabase
      .from('lead_productivity_logs')
      .select('id, lead_id, sale_id, created_at')
      .in('sale_id', salesOwnerIds)
      .eq('status', 'ปิดการขายแล้ว')
      .order('created_at', { ascending: false });

    if (logsError) throw logsError;
    productivityLogs = logs || [];

    // Process sales team data with statistics
    const processedSalesTeam = salesTeam.map(member => {
      // สำหรับ current_leads: รวมทั้ง sale_owner_id และ post_sales_owner_id
      const memberLeads = allLeads.filter(lead => 
        lead.sale_owner_id === member.id || lead.post_sales_owner_id === member.id
      );
      
      // สำหรับ conversion rate: รวมทั้ง sale_owner_id และ post_sales_owner_id
      const memberAllLeads = allLeadsForConversion.filter(lead => 
        lead.sale_owner_id === member.id || lead.post_sales_owner_id === member.id
      );
      
      // สำหรับ deals_closed: ใช้ sale_id จาก productivity logs แทน sale_owner_id จาก leads
      const memberClosedLogs = productivityLogs.filter(log => log.sale_id === member.id);
      const closedLeadsCount = memberClosedLogs.length;
      
      // Calculate conversion rate
      const totalLeads = memberAllLeads.length;
      const conversionRate = totalLeads > 0 ? (closedLeadsCount / totalLeads) * 100 : 0;

      // Calculate leads with contact info
      const leadsWithContact = memberAllLeads.filter(lead => 
        lead.tel && lead.tel.trim() !== '' && lead.tel !== 'ไม่ระบุ'
      ).length;

      return {
        ...member,
        currentLeads: memberLeads.length,
        totalLeads: totalLeads,
        closedLeads: closedLeadsCount,
        conversionRate: Math.round(conversionRate * 100) / 100,
        leadsWithContact: leadsWithContact,
        contactRate: totalLeads > 0 ? Math.round((leadsWithContact / totalLeads) * 100 * 100) / 100 : 0
      };
    });

    // Calculate overall statistics
    const totalClosedLeads = productivityLogs.length; // ใช้ sale_id จาก productivity logs
    const stats = {
      totalMembers: salesTeam.length,
      activeMembers: salesTeam.filter(member => member.status === 'active').length,
      totalLeads: allLeads.length,
      totalClosedLeads: totalClosedLeads,
      averageLeadsPerMember: salesTeam.length > 0 ? Math.round((allLeads.length / salesTeam.length) * 100) / 100 : 0,
      overallConversionRate: allLeadsForConversion.length > 0 
        ? Math.round((totalClosedLeads / allLeadsForConversion.length) * 100 * 100) / 100 
        : 0
    };

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        data: processedSalesTeam,
        stats,
        meta: {
          executionTime: `${executionTime.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
          totalMembers: salesTeam.length,
          totalLeads: allLeads.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Sales Team API Error:', error);
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
