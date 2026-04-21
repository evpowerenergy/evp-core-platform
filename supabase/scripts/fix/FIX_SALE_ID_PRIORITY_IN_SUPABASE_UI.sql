-- =============================================================================
-- SQL Query สำหรับรันใน Supabase UI
-- =============================================================================
-- Purpose: แก้ไข priority ของ trigger ให้ใช้ staff_id ก่อน sale_owner_id
-- Reason: sale_id ควรเป็นคนที่สร้าง log จริงๆ ไม่ใช่ sale_owner_id ของ lead
-- Priority: staff_id → sales_team > sale_owner_id (fallback)
-- =============================================================================

-- Function สำหรับ auto-fill sale_id (แก้ไข priority)
-- Priority: staff_id → sales_team > sale_owner_id (fallback)
CREATE OR REPLACE FUNCTION public.set_sale_id_for_productivity_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_staff_sale_id INTEGER;
  v_lead_sale_owner_id INTEGER;
BEGIN
  -- ถ้ายังไม่มี sale_id ให้หาให้
  IF NEW.sale_id IS NULL THEN
    -- Priority 1: ใช้ staff_id → map ไปหา sale_id (คนที่สร้าง log จริงๆ)
    -- ⚠️ ต้องเช็ค staff_id IS NOT NULL ก่อน
    IF NEW.staff_id IS NOT NULL THEN
      SELECT st.id INTO v_staff_sale_id
      FROM public.users u
      JOIN public.sales_team_with_user_info st ON u.id = st.user_id
      WHERE u.auth_user_id = NEW.staff_id
        AND st.status = 'active'
      LIMIT 1;
      
      -- ถ้า staff_id map ได้ sale_id ให้ใช้เลย
      IF v_staff_sale_id IS NOT NULL THEN
        NEW.sale_id := v_staff_sale_id;
      END IF;
    END IF;
    
    -- Priority 2 (Fallback): ถ้า staff_id map ไม่ได้ หรือ staff ไม่ใช่ sale
    -- ให้ใช้ sale_owner_id จาก lead เป็น fallback
    IF NEW.sale_id IS NULL AND NEW.lead_id IS NOT NULL THEN
      SELECT l.sale_owner_id INTO v_lead_sale_owner_id
      FROM public.leads l
      WHERE l.id = NEW.lead_id
      LIMIT 1;
      
      -- ถ้า lead มี sale_owner_id ให้ใช้ sale_owner_id เป็น fallback
      IF v_lead_sale_owner_id IS NOT NULL THEN
        NEW.sale_id := v_lead_sale_owner_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- สร้าง Trigger (ถ้ายังไม่มี)
DROP TRIGGER IF EXISTS set_sale_id_trigger ON lead_productivity_logs;
CREATE TRIGGER set_sale_id_trigger
  BEFORE INSERT OR UPDATE ON lead_productivity_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_sale_id_for_productivity_log();

-- =============================================================================
-- Notes:
-- - Trigger จะทำงานทุกครั้งที่ INSERT หรือ UPDATE lead_productivity_logs
-- - Priority ใหม่: staff_id → sales_team > sale_owner_id (fallback)
-- - ถ้า sale_id มีค่าแล้ว จะไม่ทำอะไร (ไม่ override)
-- - sale_id จะเป็นคนที่สร้าง log จริงๆ (ตาม staff_id) ไม่ใช่ sale_owner_id ของ lead
-- =============================================================================

-- =============================================================================
-- ตรวจสอบ Trigger หลังแก้ไข
-- =============================================================================

-- 1. ตรวจสอบว่า Trigger ถูกสร้างแล้ว
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'set_sale_id_trigger'
  AND event_object_table = 'lead_productivity_logs';

-- 2. ตรวจสอบ Function
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'set_sale_id_for_productivity_log'
  AND routine_schema = 'public';

