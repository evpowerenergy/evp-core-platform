
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSalesDataInPeriod } from "@/utils/salesUtils";

export const useSalesTeamOptimized = () => {
  return useQuery({
    queryKey: ['sales-team-optimized'],
    queryFn: async () => {
  
      
      // Get sales team data using the table (no longer a view)
      const { data: salesTeam, error: salesTeamError } = await supabase
        .from('sales_team_with_user_info')
        .select('id, name, email, status, current_leads');

      if (salesTeamError) throw salesTeamError;
      if (!salesTeam?.length) return [];

      

      // Get all leads data for all sales members in one optimized query
      const salesOwnerIds = salesTeam.map(member => member.id);
      
      // Query leads with better optimization
      const { data: allLeads, error: leadsError } = await supabase
        .from('leads')
        .select('id, sale_owner_id, status')
        .in('sale_owner_id', salesOwnerIds)
        .in('status', ['กำลังติดตาม', 'ปิดการขาย']); // Filter only relevant statuses

      if (leadsError) throw leadsError;

      // Get ALL leads data for conversion rate calculation (including all statuses)
      const { data: allLeadsForConversion, error: allLeadsError } = await supabase
        .from('leads')
        .select('id, sale_owner_id, status, tel, line_id')
        .in('sale_owner_id', salesOwnerIds)
;

      if (allLeadsError) throw allLeadsError;

      // Query quotations with better optimization - Correct approach
      // First get all leads that are closed sales
      const { data: closedLeads, error: closedLeadsError } = await supabase
        .from('leads')
        .select('id, sale_owner_id')
        .in('sale_owner_id', salesOwnerIds)
        .eq('status', 'ปิดการขาย') // Correct status value
;

      if (closedLeadsError) throw closedLeadsError;

      // Get productivity logs for closed leads that have status 'ปิดการขายแล้ว'
      const closedLeadIds = closedLeads?.map(lead => lead.id) || [];
      let quotationsData: any[] = [];
      let productivityLogsData: any[] = [];
      
      if (closedLeadIds.length > 0) {
        const { data: productivityLogsResult, error: productivityLogsError } = await supabase
          .from('lead_productivity_logs')
          .select('id, lead_id, status')
          .in('lead_id', closedLeadIds)
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
      }

      // Create lookup maps for better performance
      const leadsByOwner = new Map();
      const quotationsByOwner = new Map();

      // Group leads by owner
      allLeads?.forEach(lead => {
        if (!leadsByOwner.has(lead.sale_owner_id)) {
          leadsByOwner.set(lead.sale_owner_id, []);
        }
        leadsByOwner.get(lead.sale_owner_id).push(lead);
      });

      // Group quotations by owner
      quotationsData?.forEach(quotation => {
        // Find the productivity log for this quotation
        const productivityLog = productivityLogsData?.find(log => log.id === quotation.productivity_log_id);
        // Find the lead for this productivity log
        const lead = closedLeads?.find(lead => lead.id === productivityLog?.lead_id);
        const ownerId = lead?.sale_owner_id;
        
        if (ownerId) {
          if (!quotationsByOwner.has(ownerId)) {
            quotationsByOwner.set(ownerId, []);
          }
          quotationsByOwner.get(ownerId).push(quotation);
        }
      });

      // Process data for each sales team member with optimized calculations
      const enhancedTeam = await Promise.all(salesTeam.map(async member => {
        const memberLeads = leadsByOwner.get(member.id) || [];
        const closedLeads = memberLeads.filter(lead => lead.status === 'ปิดการขาย');
        const totalLeads = allLeadsForConversion?.filter(lead => 
          lead.sale_owner_id === member.id && lead.tel && lead.tel.trim() !== ''
        ).length || 0;
        const closedCount = closedLeads.length;
        
        // Calculate total sales amount using getSalesDataInPeriod for deduplication
        let totalSalesAmount = 0;
        try {
          // Get sales data for this specific member with deduplication
          const memberSalesData = await getSalesDataInPeriod(
            new Date().toISOString(), // Use current date as fallback
            new Date().toISOString(),
            member.id.toString()
          );
          
          // Calculate from salesLeads with deduplication
          // ✅ ใช้ saleId จาก log (คนที่ปิดการขายจริงๆ) แทน saleOwnerId จาก lead
          const memberSalesLeads = memberSalesData.salesLeads?.filter(lead => 
            (lead.saleId || lead.saleOwnerId) === member.id
          ) || [];
          totalSalesAmount = memberSalesLeads.reduce((sum, lead) => {
            const leadQuotationSum = (lead.quotationDocuments || []).reduce((qSum, doc) => qSum + (parseFloat(doc.amount) || 0), 0);
            return sum + leadQuotationSum;
          }, 0);
        } catch (error) {
          console.error('Error getting sales data for member:', member.id, error);
          // Fallback to old method if error
          const memberQuotations = quotationsByOwner.get(member.id) || [];
          totalSalesAmount = memberQuotations.reduce((sum, quotation) => {
            return sum + (quotation.total_amount || 0);
          }, 0);
        }

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
      }));

      
      return enhancedTeam;
    },
    staleTime: 1000 * 60 * 5, // cache 5 นาที (ลดลงจาก 10 เพราะตอนนี้เป็น table แล้ว query เร็วขึ้น)
    gcTime: 1000 * 60 * 30, // cache 30 นาที  
    refetchOnWindowFocus: false,
  });
}; 
