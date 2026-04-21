
import { supabase } from "@/integrations/supabase/client";
import { getSalesDataInPeriod } from "./salesUtils";

export const updateSalesTeamCurrentLeads = async (salesOwnerId: number) => {
  try {
    // Count current active leads for this sales owner
    // รวมทั้ง sale_owner_id และ post_sales_owner_id เพื่อให้ current_leads แสดงจำนวน leads ที่ sale รับผิดชอบทั้งหมด
    const { count } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .or(`sale_owner_id.eq.${salesOwnerId},post_sales_owner_id.eq.${salesOwnerId}`)
      .in('status', ['กำลังติดตาม']);

    // Update the sales team member's current_leads using the new table
    await supabase
      .from('sales_team_with_user_info')
      .update({ current_leads: count || 0 })
      .eq('id', salesOwnerId);

    return count || 0;
  } catch (error) {
    console.error('Error updating sales team current leads:', error);
    return 0;
  }
};

export const updateAllSalesTeamCurrentLeads = async () => {
  try {
    // Get all sales team members using the updated table
    const { data: salesTeam } = await supabase
      .from('sales_team_with_user_info')
      .select('id');

    if (salesTeam) {
      // Update each member's current leads in parallel
      await Promise.all(
        salesTeam.map(member => updateSalesTeamCurrentLeads(member.id))
      );
    }
  } catch (error) {
    console.error('Error updating all sales team current leads:', error);
  }
};

// New optimized function to get all sales team data with metrics in one go
export const getEnhancedSalesTeamData = async () => {
  try {

    
    // Get sales team data using the new table that auto-syncs with users
    const { data: salesTeam, error: salesTeamError } = await supabase
      .from('sales_team_with_user_info')
      .select('id, name, email, status, current_leads');

    if (salesTeamError) throw salesTeamError;
    if (!salesTeam?.length) return [];

    

    // Get all leads data for all sales members in one query
    // รวมทั้ง sale_owner_id และ post_sales_owner_id สำหรับ current_leads และ conversion rate
    const salesOwnerIds = salesTeam.map(member => member.id);
    
    // Build OR condition: sale_owner_id.in.(...) หรือ post_sales_owner_id.in.(...)
    const saleOwnerIdsStr = salesOwnerIds.join(',');
    const orCondition = `sale_owner_id.in.(${saleOwnerIdsStr}),post_sales_owner_id.in.(${saleOwnerIdsStr})`;
    
    const { data: allLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, sale_owner_id, post_sales_owner_id, status')
      .or(orCondition)
      .in('status', ['กำลังติดตาม', 'ปิดการขาย']); // Filter only relevant statuses

    if (leadsError) throw leadsError;

    // Get ALL leads data for conversion rate calculation (including all statuses)
    // รวมทั้ง sale_owner_id และ post_sales_owner_id
    const { data: allLeadsForConversion, error: allLeadsError } = await supabase
      .from('leads')
      .select('id, sale_owner_id, post_sales_owner_id, status, tel')
      .or(orCondition);

    if (allLeadsError) throw allLeadsError;

    // ✅ ใช้ sale_id จาก productivity logs แทน sale_owner_id จาก leads สำหรับการคำนวณยอดขาย
    // Query productivity logs ที่ status = 'ปิดการขายแล้ว' โดยใช้ sale_id
    let quotationsData: any[] = [];
    let productivityLogsData: any[] = [];
    
    // Query productivity logs ที่ status = 'ปิดการขายแล้ว' และ sale_id ใน salesOwnerIds
    const { data: productivityLogsResult, error: productivityLogsError } = await supabase
      .from('lead_productivity_logs')
      .select('id, lead_id, sale_id, status')
      .in('sale_id', salesOwnerIds)
      .eq('status', 'ปิดการขายแล้ว'); // Only get logs with status 'ปิดการขายแล้ว'

    if (productivityLogsError) throw productivityLogsError;
    productivityLogsData = productivityLogsResult || [];

    const productivityLogIds = productivityLogsData.map(log => log.id);

    if (productivityLogIds.length > 0) {
      // Get quotations for these productivity logs
      const { data: quotationsResult, error: quotationsError } = await supabase
        .from('quotations')
        .select('total_amount, productivity_log_id')
        .in('productivity_log_id', productivityLogIds);

      if (quotationsError) throw quotationsError;
      quotationsData = quotationsResult || [];
    }

    

    // Calculate sales amounts for all members in parallel (outside of map)
    const salesAmountsPromises = salesTeam.map(async (member) => {
      try {
        const memberSalesData = await getSalesDataInPeriod(
          new Date().toISOString(),
          new Date().toISOString(),
          member.id.toString()
        );
        
        // ✅ ใช้ saleId จาก log (คนที่ปิดการขายจริงๆ) แทน saleOwnerId จาก lead
        const memberSalesLeads = memberSalesData.salesLeads?.filter(lead => 
          (lead.saleId || lead.saleOwnerId) === member.id
        ) || [];
        
        return {
          memberId: member.id,
          totalSalesAmount: memberSalesLeads.reduce((sum, lead) => {
            const leadQuotationSum = (lead.quotationDocuments || []).reduce((qSum, doc) => qSum + (parseFloat(doc.amount) || 0), 0);
            return sum + leadQuotationSum;
          }, 0)
        };
      } catch (error) {
        console.error('Error getting sales data for member:', member.id, error);
        // Fallback to old calculation - ใช้ sale_id จาก productivity logs
        const memberQuotations = quotationsData?.filter(
          q => {
            const productivityLog = productivityLogsData?.find(log => log.id === q.productivity_log_id);
            // ใช้ sale_id จาก productivity log แทน sale_owner_id จาก lead
            return productivityLog?.sale_id === member.id;
          }
        ) || [];
        
        return {
          memberId: member.id,
          totalSalesAmount: memberQuotations.reduce((sum, quotation) => sum + (quotation.total_amount || 0), 0)
        };
      }
    });

    const salesAmountsResults = await Promise.all(salesAmountsPromises);
    const salesAmountsMap = new Map(salesAmountsResults.map(r => [r.memberId, r.totalSalesAmount]));

    // Process data for each sales team member
    const enhancedTeam = salesTeam.map(member => {
      // สำหรับ current_leads และ conversion rate: รวมทั้ง sale_owner_id และ post_sales_owner_id
      const memberLeads = allLeads?.filter(lead => 
        lead.sale_owner_id === member.id || lead.post_sales_owner_id === member.id
      ) || [];
      
      // สำหรับ deals_closed: ใช้ sale_id จาก productivity logs แทน sale_owner_id จาก leads
      const memberClosedLogs = productivityLogsData?.filter(log => log.sale_id === member.id) || [];
      const closedCount = memberClosedLogs.length;
      
      // สำหรับ conversion rate: รวมทั้ง sale_owner_id และ post_sales_owner_id
      const totalLeads = allLeadsForConversion?.filter(lead => 
        (lead.sale_owner_id === member.id || lead.post_sales_owner_id === member.id) && 
        lead.tel && lead.tel.trim() !== ''
      ).length || 0;
      
      // Get pre-calculated sales amount from map
      const totalSalesAmount = salesAmountsMap.get(member.id) || 0;

      // Calculate conversion rate (จำนวนลีดที่ปิดการขาย / จำนวนลีดที่กำลังติดตามและปิดการขาย) * 100
      const conversionRate = totalLeads > 0 ? (closedCount / totalLeads) * 100 : 0;

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        status: member.status,
        current_leads: member.current_leads || 0,
        deals_closed: closedCount,
        pipeline_value: totalSalesAmount,
        conversion_rate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
        total_leads: totalLeads // Add total leads for team calculation
      };
    });


    return enhancedTeam;

  } catch (error) {
    console.error('Error fetching enhanced sales team data:', error);
    throw error;
  }
};
