-- =============================================================================
-- Migration: RPC get_latest_productivity_logs_for_leads
-- =============================================================================
-- Purpose: ดึง productivity log ล่าสุดต่อ lead โดยใช้ DISTINCT ON
--          แก้ปัญหา PostgREST row limit (~1000) บน /my-leads
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_latest_productivity_logs_for_leads(lead_ids integer[])
RETURNS TABLE (
  id integer,
  lead_id integer,
  sale_id integer,
  note text,
  status text,
  created_at_thai timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (lpl.lead_id)
    lpl.id,
    lpl.lead_id,
    lpl.sale_id,
    lpl.note,
    lpl.status,
    lpl.created_at_thai
  FROM public.lead_productivity_logs lpl
  WHERE lpl.lead_id = ANY(lead_ids)
  ORDER BY lpl.lead_id, lpl.created_at_thai DESC NULLS LAST, lpl.id DESC;
$$;

COMMENT ON FUNCTION public.get_latest_productivity_logs_for_leads(integer[]) IS
  'Returns the latest productivity log per lead_id. Used by /my-leads API to avoid PostgREST row limits.';

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_latest_productivity_logs_for_leads(integer[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_latest_productivity_logs_for_leads(integer[]) TO service_role;
