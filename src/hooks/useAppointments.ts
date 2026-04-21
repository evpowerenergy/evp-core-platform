import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "./useUserData";
import { useCacheStrategy } from "@/lib/cacheStrategies";

export const useAppointments = () => {
  const { data: userData } = useUserData();
  const salesMember = userData?.salesMember;
  const realtimeCacheStrategy = useCacheStrategy('REALTIME');

  return useQuery({
    queryKey: ['appointments', salesMember?.id],
    queryFn: async () => {
      if (!salesMember?.id) return { followUp: [], engineer: [], payment: [] };

      // Get productivity logs for this sales member first
      const { data: productivityLogs, error: logsError } = await supabase
        .from('lead_productivity_logs')
        .select(`
          id,
          sale_id,
          next_follow_up,
          next_follow_up_details,
          created_at,
          lead_id,
          lead:leads!inner(
            id,
            full_name,
            tel,
            region,
            platform,
            sale_owner_id,
            category,
            operation_status
          )
        `)
        .eq('sale_id', salesMember.id)
        .neq('lead.operation_status', 'ปิดการขายแล้ว')
        .neq('lead.operation_status', 'ปิดการขายไม่สำเร็จ')
        .order('created_at', { ascending: false });

      if (logsError) {
        console.error('Error fetching productivity logs:', logsError);
        return { followUp: [], engineer: [], payment: [] };
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
          date: item.date!,
          type: 'follow-up' as const,
          details: item.note,
          lead: relatedLog?.lead || { id: 0, full_name: 'Unknown' },
          source: 'appointment' as const
        };
      });

      // Process engineer appointments
      const engineer = (engineerData.data || []).map(item => {
        const relatedLog = latestLogs?.find(log => log.id === item.productivity_log_id);
        return {
          id: item.id,
          date: item.date!,
          location: item.location,
          building_details: item.building_details,
          installation_notes: item.installation_notes,
          status: item.status || 'scheduled',
          note: item.note,
          type: 'engineer' as const,
          lead: relatedLog?.lead || { id: 0, full_name: 'Unknown' },
          source: 'appointment' as const
        };
      });

      // Process payment appointments
      const payment = (paymentData.data || []).map(item => {
        const relatedLog = latestLogs?.find(log => log.id === item.productivity_log_id);
        return {
          id: item.id,
          date: item.estimate_payment_date!,
          total_amount: item.total_amount,
          payment_method: item.payment_method,
          type: 'payment' as const,
          lead: relatedLog?.lead || { id: 0, full_name: 'Unknown' },
          source: 'quotation' as const
        };
      });

      return { followUp, engineer, payment };
    },
    enabled: !!salesMember?.id,
    ...realtimeCacheStrategy, // ✅ ใช้ REALTIME cache strategy
  });
}; 