-- =============================================================================
-- Migration: Create Trigger Auto-fill sale_id for lead_productivity_logs
-- =============================================================================
-- Purpose: Auto-fill sale_id column in lead_productivity_logs table
-- Priority: leads.sale_owner_id > staff_id → sales_team
-- =============================================================================

-- Function สำหรับ auto-fill sale_id
-- Priority: leads.sale_owner_id > staff_id → sales_team
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
    -- ⚠️ ต้องเช็ค lead_id IS NOT NULL ก่อน
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

-- สร้าง Trigger
DROP TRIGGER IF EXISTS set_sale_id_trigger ON lead_productivity_logs;
CREATE TRIGGER set_sale_id_trigger
  BEFORE INSERT OR UPDATE ON lead_productivity_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_sale_id_for_productivity_log();

-- =============================================================================
-- Notes:
-- - Trigger จะทำงานทุกครั้งที่ INSERT หรือ UPDATE lead_productivity_logs
-- - Priority: leads.sale_owner_id > staff_id → sales_team
-- - ถ้า sale_id มีค่าแล้ว จะไม่ทำอะไร (ไม่ override)
-- =============================================================================

