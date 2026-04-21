-- 🔍 ตรวจสอบ sale_id หลังอัพเดท
-- วัตถุประสงค์: เช็คว่า sale_id ที่อัพเดทแล้วตรงกับ leads.sale_owner_id หรือไม่

-- =============================================================================
-- Query 1: ตรวจสอบ sale_id ที่อัพเดทแล้ว (ใช้ sale_id column โดยตรง)
-- =============================================================================

SELECT 
  lpl.id as log_id,
  lpl.lead_id,
  lpl.staff_id,
  lpl.sale_id as log_sale_id,  -- ← ใช้ sale_id ที่อัพเดทแล้ว
  lpl.status,
  l.sale_owner_id as lead_sale_owner_id,
  st1.name as lead_sale_owner_name,
  st2.name as log_sale_name,
  CASE 
    WHEN l.sale_owner_id IS NOT NULL AND lpl.sale_id IS NOT NULL 
      AND l.sale_owner_id != lpl.sale_id 
    THEN '⚠️ ไม่ตรงกัน (คนละคน)'
    WHEN l.sale_owner_id IS NULL AND lpl.sale_id IS NOT NULL 
    THEN '⚠️ Lead ไม่มี sale_owner_id แต่ log มี sale_id'
    WHEN l.sale_owner_id IS NOT NULL AND lpl.sale_id IS NULL 
    THEN '⚠️ Lead มี sale_owner_id แต่ log ไม่มี sale_id'
    WHEN l.sale_owner_id IS NOT NULL AND lpl.sale_id IS NOT NULL 
      AND l.sale_owner_id = lpl.sale_id 
    THEN '✅ ตรงกัน'
    ELSE '❓ ไม่มีทั้งสอง'
  END as status_description
FROM public.lead_productivity_logs lpl
LEFT JOIN public.leads l ON lpl.lead_id = l.id
LEFT JOIN public.sales_team_with_user_info st1 ON l.sale_owner_id = st1.id
LEFT JOIN public.sales_team_with_user_info st2 ON lpl.sale_id = st2.id
WHERE (
  (l.sale_owner_id IS NOT NULL AND lpl.sale_id IS NOT NULL AND l.sale_owner_id != lpl.sale_id)
  OR
  (l.sale_owner_id IS NULL AND lpl.sale_id IS NOT NULL)
  OR
  (l.sale_owner_id IS NOT NULL AND lpl.sale_id IS NULL)
)
ORDER BY lpl.created_at_thai DESC;

-- =============================================================================
-- Query 2: สรุปจำนวน logs ที่ไม่ตรงกัน (ใช้ sale_id column)
-- =============================================================================

SELECT 
  'ไม่ตรงกัน (คนละคน)' as category,
  COUNT(*) as count
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
WHERE l.sale_owner_id IS NOT NULL 
  AND lpl.sale_id IS NOT NULL
  AND l.sale_owner_id != lpl.sale_id

UNION ALL

SELECT 
  'Lead ไม่มี sale_owner_id แต่ log มี sale_id' as category,
  COUNT(*) as count
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
WHERE l.sale_owner_id IS NULL 
  AND lpl.sale_id IS NOT NULL

UNION ALL

SELECT 
  'Lead มี sale_owner_id แต่ log ไม่มี sale_id' as category,
  COUNT(*) as count
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
WHERE l.sale_owner_id IS NOT NULL 
  AND lpl.sale_id IS NULL

ORDER BY count DESC;

-- =============================================================================
-- Query 3: เปรียบเทียบ Query เก่า vs Query ใหม่
-- =============================================================================

-- 3.1 Query เก่า (เช็คจาก staff_id → users → sales_team)
SELECT 
  'Query เก่า (เช็คจาก staff_id)' as query_type,
  COUNT(*) as not_matching_count
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
LEFT JOIN public.users u ON lpl.staff_id = u.auth_user_id
LEFT JOIN public.sales_team_with_user_info st2 ON u.id = st2.user_id
WHERE l.sale_owner_id IS NOT NULL 
  AND st2.id IS NOT NULL
  AND l.sale_owner_id != st2.id

UNION ALL

-- 3.2 Query ใหม่ (เช็คจาก sale_id column)
SELECT 
  'Query ใหม่ (เช็คจาก sale_id)' as query_type,
  COUNT(*) as not_matching_count
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
WHERE l.sale_owner_id IS NOT NULL 
  AND lpl.sale_id IS NOT NULL
  AND l.sale_owner_id != lpl.sale_id;

-- =============================================================================
-- Query 4: ตรวจสอบว่า sale_id column มีข้อมูลหรือไม่
-- =============================================================================

SELECT 
  COUNT(*) as total_logs,
  COUNT(sale_id) as logs_with_sale_id,
  COUNT(*) - COUNT(sale_id) as logs_without_sale_id,
  COUNT(CASE WHEN sale_id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as percentage_with_sale_id
FROM public.lead_productivity_logs;

-- =============================================================================
-- Query 5: ตรวจสอบว่า sale_id ถูกอัพเดทจาก leads.sale_owner_id หรือไม่
-- =============================================================================

SELECT 
  COUNT(*) as total_logs_with_both,
  COUNT(CASE WHEN l.sale_owner_id = lpl.sale_id THEN 1 END) as matching_count,
  COUNT(CASE WHEN l.sale_owner_id != lpl.sale_id THEN 1 END) as not_matching_count,
  COUNT(CASE WHEN l.sale_owner_id = lpl.sale_id THEN 1 END) * 100.0 / COUNT(*) as matching_percentage
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
WHERE l.sale_owner_id IS NOT NULL 
  AND lpl.sale_id IS NOT NULL;

