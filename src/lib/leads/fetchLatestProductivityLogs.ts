import { supabase } from '@/integrations/supabase/client';

export type LatestProductivityLog = {
  id: number;
  lead_id: number;
  sale_id: number | null;
  note: string | null;
  status: string | null;
  created_at_thai: string | null;
};

const LEAD_IDS_CHUNK_SIZE = 500;

/**
 * Client-side: ดึง productivity log ล่าสุดต่อ lead ผ่าน RPC
 */
export async function fetchLatestProductivityLogsByLeadIds(
  leadIds: number[]
): Promise<Map<number, LatestProductivityLog>> {
  const latestLogsMap = new Map<number, LatestProductivityLog>();

  if (leadIds.length === 0) {
    return latestLogsMap;
  }

  for (let i = 0; i < leadIds.length; i += LEAD_IDS_CHUNK_SIZE) {
    const chunk = leadIds.slice(i, i + LEAD_IDS_CHUNK_SIZE);

    const { data, error } = await supabase.rpc('get_latest_productivity_logs_for_leads', {
      lead_ids: chunk,
    });

    if (error) {
      console.error('[fetchLatestProductivityLogs] RPC error:', error);
      throw error;
    }

    (data as LatestProductivityLog[] | null)?.forEach((log) => {
      if (log.lead_id != null) {
        latestLogsMap.set(log.lead_id, log);
      }
    });
  }

  return latestLogsMap;
}

export function attachLatestProductivityLogs<T extends { id: number }>(
  leads: T[],
  latestLogsMap: Map<number, LatestProductivityLog>
): Array<T & { latest_productivity_log: LatestProductivityLog | null }> {
  return leads.map((lead) => ({
    ...lead,
    latest_productivity_log: latestLogsMap.get(lead.id) ?? null,
  }));
}
