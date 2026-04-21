-- 🔍 ตรวจสอบ Trigger Function สำหรับ auto-fill sale_id
-- วัตถุประสงค์: ตรวจสอบว่า Trigger function ถูกต้องหรือไม่

-- =============================================================================
-- Query 1: ตรวจสอบว่า Trigger มีอยู่แล้วหรือไม่
-- =============================================================================

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'lead_productivity_logs'
  AND trigger_name = 'set_sale_id_trigger';

-- =============================================================================
-- Query 2: ตรวจสอบว่า Function มีอยู่แล้วหรือไม่
-- =============================================================================

SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'set_sale_id_for_productivity_log';

-- =============================================================================
-- Query 3: ทดสอบ Trigger Function (ไม่สร้างจริง)
-- =============================================================================

-- 3.1 ตรวจสอบ logic ของ function
-- Logic ที่ถูกต้อง:
-- 1. ถ้า sale_id เป็น NULL ให้หา
-- 2. Priority 1: หา sale_owner_id จาก leads (ถ้ามี)
-- 3. Priority 2: หา sale_id จาก staff_id → users → sales_team (ถ้า lead ไม่มี sale_owner_id)

-- ⚠️ ตรวจสอบว่า:
-- - ✅ เช็ค NEW.sale_id IS NULL ก่อน
-- - ✅ เช็ค NEW.lead_id IS NOT NULL (สำหรับ query leads)
-- - ✅ เช็ค NEW.staff_id IS NOT NULL (สำหรับ query users)
-- - ✅ ใช้ LIMIT 1 เพื่อป้องกัน error
-- - ✅ RETURN NEW เสมอ

-- =============================================================================
-- Query 4: ตรวจสอบ Edge Cases
-- =============================================================================

-- 4.1 ตรวจสอบว่า lead_id เป็น NULL ได้หรือไม่
SELECT 
  COUNT(*) as logs_with_null_lead_id
FROM public.lead_productivity_logs
WHERE lead_id IS NULL;

-- 4.2 ตรวจสอบว่า staff_id เป็น NULL ได้หรือไม่
SELECT 
  COUNT(*) as logs_with_null_staff_id
FROM public.lead_productivity_logs
WHERE staff_id IS NULL;

-- 4.3 ตรวจสอบว่า lead_id ไม่มีใน leads table
SELECT 
  COUNT(*) as logs_with_invalid_lead_id
FROM public.lead_productivity_logs lpl
LEFT JOIN public.leads l ON lpl.lead_id = l.id
WHERE lpl.lead_id IS NOT NULL
  AND l.id IS NULL;

-- =============================================================================
-- Query 5: ทดสอบ Trigger Function Logic (Manual Test)
-- =============================================================================

-- 5.1 จำลองการทำงานของ Trigger
-- Scenario 1: Lead มี sale_owner_id
SELECT 
  l.id as lead_id,
  l.sale_owner_id,
  'Trigger จะใช้ sale_owner_id นี้' as expected_result
FROM public.leads l
WHERE l.sale_owner_id IS NOT NULL
LIMIT 5;

-- Scenario 2: Lead ไม่มี sale_owner_id แต่ staff_id มี
SELECT 
  lpl.id as log_id,
  lpl.lead_id,
  lpl.staff_id,
  l.sale_owner_id as lead_sale_owner_id,
  st.id as staff_sale_id,
  'Trigger จะใช้ staff_sale_id นี้' as expected_result
FROM public.lead_productivity_logs lpl
LEFT JOIN public.leads l ON lpl.lead_id = l.id
LEFT JOIN public.users u ON lpl.staff_id = u.auth_user_id
LEFT JOIN public.sales_team_with_user_info st ON u.id = st.user_id
WHERE l.sale_owner_id IS NULL
  AND lpl.staff_id IS NOT NULL
  AND st.id IS NOT NULL
LIMIT 5;

-- =============================================================================
-- Query 6: ตรวจสอบ Trigger Function ที่ถูกต้อง (Final Version)
-- =============================================================================

-- ✅ Trigger Function ที่ถูกต้อง (ยึดตาม leads.sale_owner_id เป็นหลัก)
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
    -- ⚠️ ต้องเช็ค lead_id ก่อน
    IF NEW.lead_id IS NOT NULL THEN
      SELECT l.sale_owner_id INTO v_lead_sale_owner_id
      FROM public.leads l
      WHERE l.id = NEW.lead_id
      LIMIT 1;
      
      -- 2. ถ้า lead มี sale_owner_id ให้ใช้ sale_owner_id
      IF v_lead_sale_owner_id IS NOT NULL THEN
        NEW.sale_id := v_lead_sale_owner_id;
      END IF;
    END IF;
    
    -- 3. ถ้า lead ไม่มี sale_owner_id ให้ใช้ sale_id จาก staff_id
    -- ⚠️ ต้องเช็คว่ายังไม่มี sale_id และ staff_id มีค่า
    IF NEW.sale_id IS NULL AND NEW.staff_id IS NOT NULL THEN
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
*/

-- =============================================================================
-- Query 7: เปรียบเทียบ Trigger Function เก่า vs ใหม่
-- =============================================================================

-- 7.1 Trigger Function เก่า (ไม่ยึดตาม leads.sale_owner_id)
-- ❌ ใช้แค่ staff_id → sales_team
-- ❌ ไม่ยึดตาม leads.sale_owner_id

-- 7.2 Trigger Function ใหม่ (ยึดตาม leads.sale_owner_id)
-- ✅ Priority 1: ใช้ leads.sale_owner_id ก่อน
-- ✅ Priority 2: ใช้ staff_id → sales_team (ถ้า lead ไม่มี sale_owner_id)
-- ✅ เช็ค lead_id และ staff_id ก่อน query

