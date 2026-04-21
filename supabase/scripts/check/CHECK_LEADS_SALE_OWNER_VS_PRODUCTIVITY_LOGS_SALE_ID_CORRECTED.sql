-- 🔍 ตรวจสอบ leads.sale_owner_id vs lead_productivity_logs.sale_id (Query ใหม่ - ใช้ sale_id column)
-- วัตถุประสงค์: หา logs ที่ sale_owner_id ของ lead ไม่ตรงกับ sale_id ของ log (เช็คจาก sale_id column โดยตรง)

-- =============================================================================
-- Query 1: ตรวจสอบ logs ที่ไม่ตรงกัน (ใช้ sale_id column โดยตรง) ⭐
-- =============================================================================

SELECT 
  lpl.id as log_id,
  lpl.lead_id,
  lpl.staff_id,
  lpl.sale_id as log_sale_id,  -- ← ใช้ sale_id column ที่อัพเดทแล้ว
  lpl.status,
  lpl.created_at_thai,
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
LEFT JOIN public.sales_team_with_user_info st2 ON lpl.sale_id = st2.id  -- ← เช็คจาก sale_id column
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

-- 3.1 Query เก่า (เช็คจาก staff_id → users → sales_team) - ยังขึ้น 49 rows
SELECT 
  'Query เก่า (เช็คจาก staff_id)' as query_type,
  COUNT(*) as not_matching_count
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
LEFT JOIN public.users u ON lpl.staff_id = u.auth_user_id
LEFT JOIN public.sales_team_with_user_info st2 ON u.id = st2.user_id
WHERE l.sale_owner_id IS NOT NULL 
  AND st2.id IS NOT NULL
  AND l.sale_owner_id != st2.id;

-- 3.2 Query ใหม่ (เช็คจาก sale_id column) - ควรเป็น 0 หลังอัพเดท
SELECT 
  'Query ใหม่ (เช็คจาก sale_id)' as query_type,
  COUNT(*) as not_matching_count
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
WHERE l.sale_owner_id IS NOT NULL 
  AND lpl.sale_id IS NOT NULL
  AND l.sale_owner_id != lpl.sale_id;

-- =============================================================================
-- Query 4: ตรวจสอบว่า sale_id ถูกอัพเดทแล้วหรือไม่
-- =============================================================================

-- 4.1 เช็คว่า sale_id column มีข้อมูลหรือไม่
SELECT 
  COUNT(*) as total_logs,
  COUNT(sale_id) as logs_with_sale_id,
  COUNT(*) - COUNT(sale_id) as logs_without_sale_id,
  ROUND(COUNT(sale_id) * 100.0 / COUNT(*), 2) as percentage_with_sale_id
FROM public.lead_productivity_logs;

-- 4.2 เช็คว่า sale_id ตรงกับ leads.sale_owner_id หรือไม่
SELECT 
  COUNT(*) as total_logs_with_both,
  COUNT(CASE WHEN l.sale_owner_id = lpl.sale_id THEN 1 END) as matching_count,
  COUNT(CASE WHEN l.sale_owner_id != lpl.sale_id THEN 1 END) as not_matching_count,
  ROUND(COUNT(CASE WHEN l.sale_owner_id = lpl.sale_id THEN 1 END) * 100.0 / COUNT(*), 2) as matching_percentage
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
WHERE l.sale_owner_id IS NOT NULL 
  AND lpl.sale_id IS NOT NULL;

-- =============================================================================
-- Query 5: แสดงรายละเอียด logs ที่ไม่ตรงกัน (ใช้ sale_id column)
-- =============================================================================

SELECT 
  lpl.id as log_id,
  lpl.lead_id,
  lpl.sale_id as log_sale_id,
  lpl.status,
  l.sale_owner_id as lead_sale_owner_id,
  st1.name as lead_sale_owner_name,
  st2.name as log_sale_name,
  '⚠️ ต้องแก้ไข: sale_id ควรเป็น ' || l.sale_owner_id as action_needed
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
LEFT JOIN public.sales_team_with_user_info st1 ON l.sale_owner_id = st1.id
LEFT JOIN public.sales_team_with_user_info st2 ON lpl.sale_id = st2.id
WHERE l.sale_owner_id IS NOT NULL 
  AND lpl.sale_id IS NOT NULL
  AND l.sale_owner_id != lpl.sale_id
ORDER BY lpl.created_at_thai DESC;

