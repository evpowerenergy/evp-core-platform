
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
      const salesOwnerIdsStr = salesOwnerIds.join(',');
      
      // ✅ Query productivity logs ที่มี status = 'ปิดการขายแล้ว' โดยใช้ sale_id โดยตรง (ไม่ต้อง query leads ก่อน)
      // ใช้ sale_id จาก productivity logs แทน sale_owner_id จาก leads เพื่อให้ได้ข้อมูลที่แม่นยำ
      const { data: productivityLogsResult, error: productivityLogsError } = await supabase
        .from('lead_productivity_logs')
        .select('id, lead_id, sale_id, status')
        .in('sale_id', salesOwnerIds)
        .eq('status', 'ปิดการขายแล้ว'); // Only get logs with status 'ปิดการขายแล้ว'

      if (productivityLogsError) throw productivityLogsError;
      const productivityLogsData = productivityLogsResult || [];

      const productivityLogIds = productivityLogsData.map(log => log.id);
      let quotationsData: any[] = [];
      
      if (productivityLogIds.length > 0) {
        // Get quotations for these productivity logs
        const { data: quotationsResult, error: quotationsError } = await supabase
          .from('quotations')
          .select('total_amount, productivity_log_id')
          .in('productivity_log_id', productivityLogIds);

        if (quotationsError) throw quotationsError;
        quotationsData = quotationsResult || [];
      }

      // ✅ Query leads สำหรับ conversion rate calculation - รวมทั้ง sale_owner_id และ post_sales_owner_id
      const { data: allLeadsForConversion, error: allLeadsError } = await supabase
        .from('leads')
        .select('id, sale_owner_id, post_sales_owner_id, status, tel, line_id')
        .or(`sale_owner_id.in.(${salesOwnerIdsStr}),post_sales_owner_id.in.(${salesOwnerIdsStr})`)
        .in('status', ['กำลังติดตาม', 'ปิดการขาย']); // Filter only relevant statuses

      if (allLeadsError) throw allLeadsError;

      // Create lookup maps for better performance
      const quotationsByOwner = new Map();

      // ✅ Group quotations by owner - ใช้ sale_id จาก productivity logs
      quotationsData?.forEach(quotation => {
        // Find the productivity log for this quotation
        const productivityLog = productivityLogsData?.find(log => log.id === quotation.productivity_log_id);
        // Use sale_id from productivity_log directly (no need to join with lead)
        const ownerId = productivityLog?.sale_id;
        
        if (ownerId) {
          if (!quotationsByOwner.has(ownerId)) {
            quotationsByOwner.set(ownerId, []);
          }
          quotationsByOwner.get(ownerId).push(quotation);
        }
      });

      // Process data for each sales team member with optimized calculations
      const enhancedTeam = await Promise.all(salesTeam.map(async member => {
        // ✅ Count deals closed by this member - ใช้ sale_id จาก productivity logs
        const memberClosedLogs = productivityLogsData.filter(log => log.sale_id === member.id);
        const closedCount = memberClosedLogs.length;
        
        // ✅ Calculate total leads for conversion rate - รวมทั้ง sale_owner_id และ post_sales_owner_id
        const totalLeads = allLeadsForConversion?.filter(lead => 
          (lead.sale_owner_id === member.id || lead.post_sales_owner_id === member.id) && 
          lead.tel && lead.tel.trim() !== ''
        ).length || 0;
        
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
