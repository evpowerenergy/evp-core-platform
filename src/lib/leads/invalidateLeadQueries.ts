import type { QueryClient } from '@tanstack/react-query';

/**
 * Invalidate caches ที่เกี่ยวข้องหลังบันทึก/แก้ไข productivity log
 */
export function invalidateLeadRelatedQueries(
  queryClient: QueryClient,
  options?: { leadId?: number; logId?: number }
) {
  const { leadId, logId } = options ?? {};

  if (leadId != null) {
    queryClient.invalidateQueries({ queryKey: ['lead-timeline', leadId] });
    queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
  }

  if (logId != null) {
    queryClient.invalidateQueries({ queryKey: ['productivity-log', logId] });
  }

  queryClient.invalidateQueries({ queryKey: ['leads'] });
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return Array.isArray(key) && key[0] === 'app_data' && key[1] === 'my_leads';
    },
  });
  queryClient.invalidateQueries({ queryKey: ['followup-stats'] });
  queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
  queryClient.invalidateQueries({ queryKey: ['appointments'] });
}
