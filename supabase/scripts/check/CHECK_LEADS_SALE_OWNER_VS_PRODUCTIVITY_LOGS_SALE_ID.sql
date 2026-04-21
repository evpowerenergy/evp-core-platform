-- 🔍 ตรวจสอบ leads.sale_owner_id vs lead_productivity_logs.sale_id
-- วัตถุประสงค์: หา logs ที่ sale_owner_id ของ lead ไม่ตรงกับ sale_id ของ log

-- =============================================================================
-- Query 1: ตรวจสอบก่อนเพิ่ม sale_id column (ใช้ staff_id map)
-- =============================================================================

-- 1.1 ตรวจสอบ logs ที่ sale_owner_id ของ lead ไม่ตรงกับ sale_id ที่ควรจะเป็น (จาก staff_id)
SELECT 
  lpl.id as log_id,
  lpl.lead_id,
  lpl.staff_id,
  lpl.status,
  lpl.created_at_thai,
  l.sale_owner_id as lead_sale_owner_id,
  st1.name as lead_sale_owner_name,
  st2.id as log_should_have_sale_id,  -- sale_id ที่ควรจะเป็น (จาก staff_id)
  st2.name as log_should_have_sale_name,
  CASE 
    WHEN l.sale_owner_id IS NOT NULL AND st2.id IS NOT NULL 
      AND l.sale_owner_id != st2.id 
    THEN '⚠️ ไม่ตรงกัน'
    WHEN l.sale_owner_id IS NULL AND st2.id IS NOT NULL 
    THEN '⚠️ Lead ไม่มี sale_owner_id แต่ log ควรมี sale_id'
    WHEN l.sale_owner_id IS NOT NULL AND st2.id IS NULL 
    THEN '⚠️ Lead มี sale_owner_id แต่ log ไม่มี sale_id (staff ไม่ใช่ sale)'
    WHEN l.sale_owner_id IS NULL AND st2.id IS NULL 
    THEN '✅ ตรงกัน (ไม่มีทั้งสอง)'
    ELSE '✅ ตรงกัน'
  END as status_description
FROM public.lead_productivity_logs lpl
LEFT JOIN public.leads l ON lpl.lead_id = l.id
LEFT JOIN public.sales_team_with_user_info st1 ON l.sale_owner_id = st1.id
LEFT JOIN public.users u ON lpl.staff_id = u.auth_user_id
LEFT JOIN public.sales_team_with_user_info st2 ON u.id = st2.user_id
WHERE (
  (l.sale_owner_id IS NOT NULL AND st2.id IS NOT NULL AND l.sale_owner_id != st2.id)
  OR
  (l.sale_owner_id IS NULL AND st2.id IS NOT NULL)
  OR
  (l.sale_owner_id IS NOT NULL AND st2.id IS NULL)
)
ORDER BY lpl.created_at_thai DESC
LIMIT 50;

-- =============================================================================
-- Query 2: ตรวจสอบหลังเพิ่ม sale_id column (ใช้ sale_id ตรงๆ)
-- =============================================================================

-- 2.1 ตรวจสอบ logs ที่ sale_owner_id ของ lead ไม่ตรงกับ sale_id ของ log
SELECT 
  lpl.id as log_id,
  lpl.lead_id,
  lpl.staff_id,
  lpl.sale_id as log_sale_id,
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
    WHEN l.sale_owner_id IS NULL AND lpl.sale_id IS NULL 
    THEN '✅ ตรงกัน (ไม่มีทั้งสอง)'
    ELSE '✅ ตรงกัน'
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
ORDER BY lpl.created_at_thai DESC
LIMIT 50;

-- =============================================================================
-- Query 3: สรุปจำนวน logs ที่ไม่ตรงกัน
-- =============================================================================

-- 3.1 สรุปก่อนเพิ่ม sale_id (ใช้ staff_id map)
SELECT 
  'ไม่ตรงกัน (คนละคน)' as category,
  COUNT(*) as count
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
JOIN public.users u ON lpl.staff_id = u.auth_user_id
JOIN public.sales_team_with_user_info st ON u.id = st.user_id
WHERE l.sale_owner_id IS NOT NULL 
  AND st.id IS NOT NULL
  AND l.sale_owner_id != st.id

UNION ALL

SELECT 
  'Lead ไม่มี sale_owner_id แต่ log ควรมี sale_id' as category,
  COUNT(*) as count
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
JOIN public.users u ON lpl.staff_id = u.auth_user_id
JOIN public.sales_team_with_user_info st ON u.id = st.user_id
WHERE l.sale_owner_id IS NULL 
  AND st.id IS NOT NULL

UNION ALL

SELECT 
  'Lead มี sale_owner_id แต่ log ไม่มี sale_id (staff ไม่ใช่ sale)' as category,
  COUNT(*) as count
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
LEFT JOIN public.users u ON lpl.staff_id = u.auth_user_id
LEFT JOIN public.sales_team_with_user_info st ON u.id = st.user_id
WHERE l.sale_owner_id IS NOT NULL 
  AND st.id IS NULL

ORDER BY count DESC;

-- 3.2 สรุปหลังเพิ่ม sale_id (ใช้ sale_id ตรงๆ)
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
-- Query 4: ตรวจสอบเฉพาะ logs ที่ status = 'ปิดการขายแล้ว'
-- =============================================================================

-- 4.1 ตรวจสอบ logs ที่ปิดการขายแล้ว (ก่อนเพิ่ม sale_id)
SELECT 
  lpl.id as log_id,
  lpl.lead_id,
  lpl.staff_id,
  lpl.status,
  l.sale_owner_id as lead_sale_owner_id,
  st1.name as lead_sale_owner_name,
  st2.id as log_should_have_sale_id,
  st2.name as log_should_have_sale_name,
  CASE 
    WHEN l.sale_owner_id IS NOT NULL AND st2.id IS NOT NULL 
      AND l.sale_owner_id != st2.id 
    THEN '⚠️ ไม่ตรงกัน - อาจเป็นคนละคนที่ปิดการขาย'
    ELSE '✅ ตรงกัน'
  END as status_description
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
LEFT JOIN public.sales_team_with_user_info st1 ON l.sale_owner_id = st1.id
LEFT JOIN public.users u ON lpl.staff_id = u.auth_user_id
LEFT JOIN public.sales_team_with_user_info st2 ON u.id = st2.user_id
WHERE lpl.status = 'ปิดการขายแล้ว'
  AND l.sale_owner_id IS NOT NULL 
  AND st2.id IS NOT NULL
  AND l.sale_owner_id != st2.id
ORDER BY lpl.created_at_thai DESC;

-- 4.2 ตรวจสอบ logs ที่ปิดการขายแล้ว (หลังเพิ่ม sale_id)
SELECT 
  lpl.id as log_id,
  lpl.lead_id,
  lpl.sale_id as log_sale_id,
  lpl.status,
  l.sale_owner_id as lead_sale_owner_id,
  st1.name as lead_sale_owner_name,
  st2.name as log_sale_name,
  CASE 
    WHEN l.sale_owner_id IS NOT NULL AND lpl.sale_id IS NOT NULL 
      AND l.sale_owner_id != lpl.sale_id 
    THEN '⚠️ ไม่ตรงกัน - อาจเป็นคนละคนที่ปิดการขาย'
    ELSE '✅ ตรงกัน'
  END as status_description
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
LEFT JOIN public.sales_team_with_user_info st1 ON l.sale_owner_id = st1.id
LEFT JOIN public.sales_team_with_user_info st2 ON lpl.sale_id = st2.id
WHERE lpl.status = 'ปิดการขายแล้ว'
  AND l.sale_owner_id IS NOT NULL 
  AND lpl.sale_id IS NOT NULL
  AND l.sale_owner_id != lpl.sale_id
ORDER BY lpl.created_at_thai DESC;

-- =============================================================================
-- Query 5: ตรวจสอบเฉพาะ logs ที่ไม่ตรงกัน (สรุปแบบย่อ)
-- =============================================================================

-- 5.1 สรุปย่อ (ก่อนเพิ่ม sale_id)
SELECT 
  COUNT(*) as total_logs_not_matching,
  COUNT(DISTINCT lpl.lead_id) as unique_leads_affected,
  COUNT(DISTINCT l.sale_owner_id) as unique_lead_sale_owners,
  COUNT(DISTINCT st2.id) as unique_log_sales
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
LEFT JOIN public.users u ON lpl.staff_id = u.auth_user_id
LEFT JOIN public.sales_team_with_user_info st2 ON u.id = st2.user_id
WHERE l.sale_owner_id IS NOT NULL 
  AND st2.id IS NOT NULL
  AND l.sale_owner_id != st2.id;

-- 5.2 สรุปย่อ (หลังเพิ่ม sale_id)
SELECT 
  COUNT(*) as total_logs_not_matching,
  COUNT(DISTINCT lpl.lead_id) as unique_leads_affected,
  COUNT(DISTINCT l.sale_owner_id) as unique_lead_sale_owners,
  COUNT(DISTINCT lpl.sale_id) as unique_log_sales
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
WHERE l.sale_owner_id IS NOT NULL 
  AND lpl.sale_id IS NOT NULL
  AND l.sale_owner_id != lpl.sale_id;

