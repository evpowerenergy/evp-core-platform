import { supabase } from '@/integrations/supabase/client';

/**
 * Deletes a lead via core-leads-lead-mutations Edge Function.
 * Caller should confirm with the user before calling.
 */
export async function deleteLeadViaEdgeFunction(leadId: number): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL || 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
  const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/core-leads-lead-mutations`;

  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'delete_lead',
      leadId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete lead');
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete lead');
  }
}
