-- =============================================================================
-- ตรวจสอบว่า RPC get_latest_productivity_logs_for_leads ทำงานถูกต้อง
-- รันใน Supabase SQL Editor หลัง deploy migration
-- =============================================================================

-- 1) ตรวจสอบว่า function มีอยู่
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_latest_productivity_logs_for_leads';

-- 2) เปรียบเทียบ RPC vs query ตรงๆ สำหรับ lead ที่มีหลาย log
-- แทน LEAD_ID ด้วย lead ที่เคยมีปัญหา
/*
WITH direct AS (
  SELECT DISTINCT ON (lead_id)
    id, lead_id, note, created_at_thai
  FROM lead_productivity_logs
  WHERE lead_id = LEAD_ID
  ORDER BY lead_id, created_at_thai DESC NULLS LAST, id DESC
),
via_rpc AS (
  SELECT id, lead_id, note, created_at_thai
  FROM get_latest_productivity_logs_for_leads(ARRAY[LEAD_ID]::integer[])
)
SELECT
  'direct' AS source, d.*
FROM direct d
UNION ALL
SELECT
  'rpc' AS source, r.*
FROM via_rpc r;
*/

-- 3) นับ lead ที่มี log ใน DB แต่ RPC ไม่คืน (ควรเป็น 0)
/*
WITH sale_leads AS (
  SELECT id FROM leads WHERE sale_owner_id = 3
),
leads_with_logs AS (
  SELECT DISTINCT lpl.lead_id
  FROM lead_productivity_logs lpl
  JOIN sale_leads sl ON sl.id = lpl.lead_id
),
rpc_results AS (
  SELECT lead_id
  FROM get_latest_productivity_logs_for_leads(
    (SELECT ARRAY_AGG(id) FROM sale_leads)
  )
)
SELECT COUNT(*) AS missing_from_rpc
FROM leads_with_logs lwl
LEFT JOIN rpc_results rr ON rr.lead_id = lwl.lead_id
WHERE rr.lead_id IS NULL;
*/
