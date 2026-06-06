import type { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchLatestProductivityLogsByLeadIds,
  attachLatestProductivityLogs,
} from '@/lib/leads/fetchLatestProductivityLogs';

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
    const latestLogsMap = await fetchLatestProductivityLogsByLeadIds(leadIds);
    const enriched = attachLatestProductivityLogs(data, latestLogsMap);
    data.splice(0, data.length, ...enriched);
  }

  return (data || []).map((lead: any) => ({
    ...lead,
    creator_name: getCreatorName(lead.created_by),
  }));
}
