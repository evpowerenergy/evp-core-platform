
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MAX_FOLLOWUP_ROUNDS = 2; // กำหนดจำนวนรอบสูงสุด

export const useFollowupStats = (leadIds: number[]) => {
  return useQuery({
    queryKey: ['followup-stats', leadIds],
    queryFn: async () => {
      if (leadIds.length === 0) return {};
      
      const { data: logs, error } = await supabase
        .from('lead_productivity_logs')
        .select('lead_id')
        .in('lead_id', leadIds)
        .order('created_at_thai', { ascending: false });
      
      if (error) throw error;
      
      // นับจำนวนรอบแต่ละลีด (ใช้ unique leads)
      const followupCounts: { [key: number]: number } = {};
      const uniqueLeads = new Set();
      
      logs?.forEach(log => {
        if (log.lead_id) {
          uniqueLeads.add(log.lead_id);
          followupCounts[log.lead_id] = (followupCounts[log.lead_id] || 0) + 1;
        }
      });
      
      return followupCounts;
    },
    enabled: leadIds.length > 0,
  });
};

export const getFollowupSummary = (followupCounts: { [key: number]: number }, totalLeads: number, filteredLeadIds?: number[]) => {
  // ใช้ leadIds ที่ filter แล้วในการคำนวณ (ถ้ามี) หรือใช้ totalLeads
  const actualLeadIds = filteredLeadIds || [];
  const actualTotal = filteredLeadIds ? filteredLeadIds.length : totalLeads;
  
  // คำนวณจากลีดที่ผ่าน filter แล้วเท่านั้น
  const leadsWithFollowup = filteredLeadIds 
    ? filteredLeadIds.filter(leadId => followupCounts[leadId] > 0).length
    : Object.keys(followupCounts).length;
    
  const notStarted = Math.max(0, actualTotal - leadsWithFollowup); // ป้องกันค่าติดลบ
  
  return {
    total: actualTotal,
    notStarted
  };
};

export { MAX_FOLLOWUP_ROUNDS };
