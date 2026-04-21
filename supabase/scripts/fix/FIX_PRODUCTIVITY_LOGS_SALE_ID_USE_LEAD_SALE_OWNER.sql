-- 🔧 แก้ไข sale_id ใน lead_productivity_logs ให้ยึดตาม leads.sale_owner_id
-- วัตถุประสงค์: สำหรับ logs ที่ไม่ตรงกัน ให้ sale_id = leads.sale_owner_id

-- =============================================================================
-- Query 1: ตรวจสอบ logs ที่ไม่ตรงกัน (ก่อนแก้ไข)
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
-- Query 2: แสดงรายละเอียด logs ที่จะถูกแก้ไข
-- =============================================================================

SELECT 
  lpl.id as log_id,
  lpl.lead_id,
  lpl.staff_id,
  lpl.status,
  l.sale_owner_id as lead_sale_owner_id,
  st1.name as lead_sale_owner_name,
  st2.id as current_should_have_sale_id,  -- จาก staff_id
  st2.name as current_should_have_sale_name,
  'จะถูกแก้เป็น: ' || l.sale_owner_id as will_be_updated_to
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
LEFT JOIN public.sales_team_with_user_info st1 ON l.sale_owner_id = st1.id
LEFT JOIN public.users u ON lpl.staff_id = u.auth_user_id
LEFT JOIN public.sales_team_with_user_info st2 ON u.id = st2.user_id
WHERE l.sale_owner_id IS NOT NULL 
  AND st2.id IS NOT NULL
  AND l.sale_owner_id != st2.id
ORDER BY lpl.created_at_thai DESC
LIMIT 20;

-- =============================================================================
-- Query 3: UPDATE sale_id ให้ตรงกับ leads.sale_owner_id (สำหรับ logs ที่ไม่ตรงกัน)
-- =============================================================================

-- ⚠️ ใช้ query นี้หลังจากเพิ่ม sale_id column แล้ว
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

-- ถ้ายืนยันว่าถูกต้องแล้ว ให้ COMMIT
-- COMMIT;

-- ถ้ายังไม่แน่ใจ ให้ ROLLBACK
-- ROLLBACK;
*/

-- =============================================================================
-- Query 4: Backfill แบบใหม่ (ยึดตาม leads.sale_owner_id เป็นหลัก)
-- =============================================================================

-- ⚠️ ใช้ query นี้สำหรับ Backfill แรกครั้ง
-- ⚠️ Logic: ถ้า lead มี sale_owner_id ให้ใช้ sale_owner_id, ถ้าไม่มีให้ใช้ sale_id จาก staff_id

/*
BEGIN;

-- Step 1: อัปเดต sale_id จาก leads.sale_owner_id (ถ้ามี)
UPDATE public.lead_productivity_logs lpl
SET sale_id = l.sale_owner_id
FROM public.leads l
WHERE lpl.lead_id = l.id
  AND l.sale_owner_id IS NOT NULL
  AND lpl.sale_id IS NULL;

-- Step 2: อัปเดต sale_id จาก staff_id (สำหรับ logs ที่ lead ไม่มี sale_owner_id)
UPDATE public.lead_productivity_logs lpl
SET sale_id = st.id
FROM public.users u
JOIN public.sales_team_with_user_info st ON u.id = st.user_id
WHERE lpl.staff_id = u.auth_user_id
  AND lpl.sale_id IS NULL
  AND st.status = 'active'
  AND st.id IS NOT NULL
  AND NOT EXISTS (
    -- ไม่ต้อง update ถ้า lead มี sale_owner_id แล้ว
    SELECT 1 
    FROM public.leads l 
    WHERE l.id = lpl.lead_id 
      AND l.sale_owner_id IS NOT NULL
  );

-- ตรวจสอบผลลัพธ์
SELECT 
  COUNT(*) as total_logs_with_sale_id,
  COUNT(DISTINCT sale_id) as unique_sales
FROM public.lead_productivity_logs
WHERE sale_id IS NOT NULL;

-- ถ้ายืนยันว่าถูกต้องแล้ว ให้ COMMIT
-- COMMIT;

-- ถ้ายังไม่แน่ใจ ให้ ROLLBACK
-- ROLLBACK;
*/

-- =============================================================================
-- Query 5: แก้ไข Trigger ให้ยึดตาม leads.sale_owner_id เป็นหลัก
-- =============================================================================

-- ⚠️ ใช้ query นี้เพื่อแก้ไข Trigger function
-- ⚠️ Logic: ถ้า lead มี sale_owner_id ให้ใช้ sale_owner_id, ถ้าไม่มีให้ใช้ sale_id จาก staff_id

/*
CREATE OR REPLACE FUNCTION public.set_sale_id_for_productivity_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead_sale_owner_id INTEGER;
BEGIN
  -- ถ้ายังไม่มี sale_id ให้หาให้
  IF NEW.sale_id IS NULL THEN
    -- 1. ลองหา sale_owner_id จาก lead ก่อน (Priority สูงสุด)
    SELECT l.sale_owner_id INTO v_lead_sale_owner_id
    FROM public.leads l
    WHERE l.id = NEW.lead_id
    LIMIT 1;
    
    -- 2. ถ้า lead มี sale_owner_id ให้ใช้ sale_owner_id
    IF v_lead_sale_owner_id IS NOT NULL THEN
      NEW.sale_id := v_lead_sale_owner_id;
    -- 3. ถ้า lead ไม่มี sale_owner_id ให้ใช้ sale_id จาก staff_id
    ELSIF NEW.staff_id IS NOT NULL THEN
      SELECT st.id INTO NEW.sale_id
      FROM public.users u
      JOIN public.sales_team_with_user_info st ON u.id = st.user_id
      WHERE u.auth_user_id = NEW.staff_id
        AND st.status = 'active'
      LIMIT 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- สร้าง Trigger
DROP TRIGGER IF EXISTS set_sale_id_trigger ON lead_productivity_logs;
CREATE TRIGGER set_sale_id_trigger
  BEFORE INSERT OR UPDATE ON lead_productivity_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_sale_id_for_productivity_log();
*/

-- =============================================================================
-- Query 6: ตรวจสอบหลังแก้ไข
-- =============================================================================

-- 6.1 ตรวจสอบว่า logs ที่ไม่ตรงกันลดลงหรือไม่
SELECT 
  COUNT(*) as total_logs_not_matching_after_fix
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
WHERE l.sale_owner_id IS NOT NULL 
  AND lpl.sale_id IS NOT NULL
  AND l.sale_owner_id != lpl.sale_id;

-- 6.2 ตรวจสอบ logs ที่ตรงกันแล้ว
SELECT 
  COUNT(*) as total_logs_matching,
  COUNT(DISTINCT lpl.lead_id) as unique_leads
FROM public.lead_productivity_logs lpl
JOIN public.leads l ON lpl.lead_id = l.id
WHERE l.sale_owner_id IS NOT NULL 
  AND lpl.sale_id IS NOT NULL
  AND l.sale_owner_id = lpl.sale_id;

