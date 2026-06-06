-- =============================================================================
-- รันใน Supabase SQL Editor (Dashboard → SQL → New query)
-- =============================================================================
-- Purpose: สร้าง RPC get_latest_productivity_logs_for_leads สำหรับ /my-leads
-- ใช้เมื่อ: ยังไม่ได้รัน migration 20250606000001 ผ่าน CLI
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

GRANT EXECUTE ON FUNCTION public.get_latest_productivity_logs_for_leads(integer[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_latest_productivity_logs_for_leads(integer[]) TO service_role;

-- =============================================================================
-- ทดสอบหลังรัน (แทน LEAD_ID ด้วย lead จริง)
-- =============================================================================
/*
SELECT * FROM get_latest_productivity_logs_for_leads(ARRAY[LEAD_ID]::integer[]);

-- ทดสอบหลาย lead พร้อมกัน
SELECT lead_id, note, created_at_thai
FROM get_latest_productivity_logs_for_leads(
  (SELECT ARRAY_AGG(id) FROM leads WHERE sale_owner_id = 3 LIMIT 200)
);
*/
