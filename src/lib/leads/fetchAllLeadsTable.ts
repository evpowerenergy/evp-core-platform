import type { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';

export type AllLeadsTableFetchParams = {
  statusFilter: string;
  operationStatusFilter: string;
  platformFilter: string;
  categoryFilter: string;
  creatorFilter: string;
  searchTerm: string;
  dateRangeFilter: DateRange | undefined;
};

/**
 * Fetches all-leads table rows from Edge Function and enriches with latest productivity log + creator_name.
 */
export async function fetchAllLeadsTableWithLogs(
  params: AllLeadsTableFetchParams,
  getCreatorName: (createdBy: string | null) => string
): Promise<any[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const {
    statusFilter,
    operationStatusFilter,
    platformFilter,
    categoryFilter,
    creatorFilter,
    searchTerm,
    dateRangeFilter,
  } = params;

  const searchParams = new URLSearchParams();
  searchParams.append('type', 'table');

  if (statusFilter !== 'all') {
    searchParams.append('status', statusFilter);
  }
  if (operationStatusFilter !== 'all') {
    searchParams.append('operation_status', operationStatusFilter);
  }
  if (platformFilter !== 'all') {
    searchParams.append('platform', platformFilter);
  }
  if (categoryFilter !== 'all') {
    searchParams.append('category', categoryFilter);
  }
  if (creatorFilter !== 'all') {
    searchParams.append('creator', creatorFilter);
  }
  if (searchTerm !== '') {
    searchParams.append('search', searchTerm);
  }

  if (dateRangeFilter?.from) {
    const fromDate = dateRangeFilter.from;
    const toDate = dateRangeFilter.to || dateRangeFilter.from;

    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const startDateString = formatter.format(fromDate);
    const startString = startDateString + 'T00:00:00.000';

    const endDateString = formatter.format(toDate);
    const endString = endDateString + 'T23:59:59.999';

    searchParams.append('from', startString);
    searchParams.append('to', endString);
  }

  const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL || 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
  const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/core-leads-all-leads-report?${searchParams.toString()}`;

  const response = await fetch(edgeFunctionUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch leads for table');
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch leads for table');
  }

  const data = result.data || [];

  if (data.length > 0) {
    const leadIds = data.map((lead: { id: number }) => lead.id);

    const CHUNK_SIZE = 500;
    const chunks: number[][] = [];
    for (let i = 0; i < leadIds.length; i += CHUNK_SIZE) {
      chunks.push(leadIds.slice(i, i + CHUNK_SIZE));
    }

    const productivityLogsPromises = chunks.map((chunk) =>
      supabase
        .from('lead_productivity_logs')
        .select(
          `
          id,
          lead_id,
          note,
          status,
          created_at_thai
        `
        )
        .in('lead_id', chunk)
        .order('created_at_thai', { ascending: false })
    );

    const productivityLogsResults = await Promise.all(productivityLogsPromises);

    let allProductivityLogs: any[] = [];
    let hasError = false;

    productivityLogsResults.forEach((res, index) => {
      if (res.error) {
        console.error(`Error fetching productivity logs for chunk ${index}:`, res.error);
        hasError = true;
      } else if (res.data) {
        allProductivityLogs = [...allProductivityLogs, ...res.data];
      }
    });

    if (!hasError && allProductivityLogs.length > 0) {
      const latestLogsMap = new Map<number, any>();
      allProductivityLogs.forEach((log) => {
        if (!latestLogsMap.has(log.lead_id)) {
          latestLogsMap.set(log.lead_id, log);
        } else {
          const existingLog = latestLogsMap.get(log.lead_id);
          if (new Date(log.created_at_thai) > new Date(existingLog.created_at_thai)) {
            latestLogsMap.set(log.lead_id, log);
          }
        }
      });

      data.forEach((lead: { id: number }) => {
        const latestLog = latestLogsMap.get(lead.id);
        (lead as any).latest_productivity_log = latestLog || null;
      });
    }
  }

  return (data || []).map((lead: any) => ({
    ...lead,
    creator_name: getCreatorName(lead.created_by),
  }));
}
