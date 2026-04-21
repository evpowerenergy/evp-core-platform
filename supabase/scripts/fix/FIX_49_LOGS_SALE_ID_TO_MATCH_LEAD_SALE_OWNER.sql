-- 🔧 แก้ไข 49 logs ที่ sale_id ไม่ตรงกับ leads.sale_owner_id
-- วัตถุประสงค์: ให้ sale_id = leads.sale_owner_id สำหรับ logs ที่ไม่ตรงกัน

-- =============================================================================
-- Query 1: ตรวจสอบก่อนแก้ไข (49 logs)
-- =============================================================================

SELECT 
  COUNT(*) as total_logs_not_matching,
  COUNT(DISTINCT lpl.lead_id) as unique_leads_affected
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
LEFT JOIN public.users u ON lpl.staff_id = u.auth_user_id
LEFT JOIN public.sales_team_with_user_info st2 ON u.id = st2.user_id
WHERE l.sale_owner_id IS NOT NULL 
  AND st2.id IS NOT NULL
  AND l.sale_owner_id != st2.id;

-- =============================================================================
-- Query 2: แสดงรายละเอียด 49 logs ที่จะถูกแก้ไข
-- =============================================================================

SELECT 
  lpl.id as log_id,
  lpl.lead_id,
  lpl.staff_id,
  lpl.status,
  l.sale_owner_id as lead_sale_owner_id,
  st1.name as lead_sale_owner_name,
  st2.id as current_should_have_sale_id,  -- จาก staff_id (จะไม่ใช้)
  st2.name as current_should_have_sale_name,
  'จะถูกแก้เป็น: ' || l.sale_owner_id || ' (' || st1.name || ')' as will_be_updated_to
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
LEFT JOIN public.sales_team_with_user_info st1 ON l.sale_owner_id = st1.id
LEFT JOIN public.users u ON lpl.staff_id = u.auth_user_id
LEFT JOIN public.sales_team_with_user_info st2 ON u.id = st2.user_id
WHERE l.sale_owner_id IS NOT NULL 
  AND st2.id IS NOT NULL
  AND l.sale_owner_id != st2.id
ORDER BY lpl.created_at_thai DESC;

-- =============================================================================
-- Query 3: UPDATE sale_id ให้ตรงกับ leads.sale_owner_id (สำหรับ logs ที่ไม่ตรงกัน)
-- ⚠️ ใช้ query นี้หลังจากเพิ่ม sale_id column แล้ว
-- =============================================================================

-- ⚠️ แนะนำให้รันใน transaction และ rollback ก่อน

/*
BEGIN;

-- อัปเดต sale_id ให้ตรงกับ leads.sale_owner_id สำหรับ logs ที่ไม่ตรงกัน
UPDATE public.lead_productivity_logs lpl
SET sale_id = l.sale_owner_id
FROM public.leads l
WHERE lpl.lead_id = l.id
  AND l.sale_owner_id IS NOT NULL
  AND (
    -- กรณีที่ sale_id ไม่ตรงกับ sale_owner_id
    (lpl.sale_id IS NOT NULL AND lpl.sale_id != l.sale_owner_id)
    OR
    -- กรณีที่ sale_id เป็น NULL แต่ lead มี sale_owner_id
    (lpl.sale_id IS NULL AND l.sale_owner_id IS NOT NULL)
  );

-- ตรวจสอบผลลัพธ์
SELECT 
  COUNT(*) as updated_count,
  COUNT(DISTINCT lead_id) as unique_leads_affected
FROM public.lead_productivity_logs
WHERE sale_id IS NOT NULL;

-- ตรวจสอบว่า logs ที่ไม่ตรงกันลดลงหรือไม่
SELECT 
  COUNT(*) as remaining_not_matching
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
WHERE l.sale_owner_id IS NOT NULL 
  AND lpl.sale_id IS NOT NULL
  AND l.sale_owner_id != lpl.sale_id;

-- ถ้ายืนยันว่าถูกต้องแล้ว ให้ COMMIT
-- COMMIT;

-- ถ้ายังไม่แน่ใจ ให้ ROLLBACK
-- ROLLBACK;
*/

-- =============================================================================
-- Query 4: UPDATE sale_id ก่อนเพิ่ม column (ใช้เฉพาะ lead_id)
-- ⚠️ ใช้ query นี้สำหรับตอนนี้ (ก่อนเพิ่ม sale_id column)
-- =============================================================================

-- ⚠️ คำเตือน: Query นี้ยังไม่สามารถรันได้ เพราะยังไม่มี sale_id column
-- ⚠️ รอให้เพิ่ม sale_id column ก่อน (Task 1.1)

-- ⚠️ แต่ถ้าต้องการเตรียมไว้:
/*
-- หลังจากเพิ่ม sale_id column แล้ว ให้รัน query นี้:
UPDATE public.lead_productivity_logs lpl
SET sale_id = l.sale_owner_id
FROM public.leads l
WHERE lpl.lead_id = l.id
  AND l.sale_owner_id IS NOT NULL
  AND lpl.sale_id IS NULL;
*/

-- =============================================================================
-- Query 5: ตรวจสอบหลังแก้ไข
-- =============================================================================

-- 5.1 ตรวจสอบว่า logs ที่ไม่ตรงกันลดลงหรือไม่
SELECT 
  COUNT(*) as total_logs_not_matching_after_fix
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
WHERE l.sale_owner_id IS NOT NULL 
  AND lpl.sale_id IS NOT NULL
  AND l.sale_owner_id != lpl.sale_id;

-- 5.2 ตรวจสอบ logs ที่ตรงกันแล้ว
SELECT 
  COUNT(*) as total_logs_matching,
  COUNT(DISTINCT lpl.lead_id) as unique_leads
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
WHERE l.sale_owner_id IS NOT NULL 
  AND lpl.sale_id IS NOT NULL
  AND l.sale_owner_id = lpl.sale_id;

-- 5.3 ตรวจสอบว่าแก้ไขครบ 49 logs หรือไม่
SELECT 
  COUNT(*) as should_be_zero  -- ควรเป็น 0 หลังแก้ไข
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
LEFT JOIN public.users u ON lpl.staff_id = u.auth_user_id
LEFT JOIN public.sales_team_with_user_info st2 ON u.id = st2.user_id
WHERE l.sale_owner_id IS NOT NULL 
  AND st2.id IS NOT NULL
  AND l.sale_owner_id != st2.id
  AND lpl.sale_id != l.sale_owner_id;  -- ถ้ายังไม่ตรงกัน

