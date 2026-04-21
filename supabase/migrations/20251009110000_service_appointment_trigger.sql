-- =============================================================================
-- Database Trigger: Auto-update service visits when appointment is completed
-- วัตถุประสงค์: อัปเดต service_visit_1/2 อัตโนมัติเมื่อช่างเปลี่ยน status เป็น 'completed'
-- =============================================================================

-- สร้าง Function ที่จะรันเมื่อ status เปลี่ยน
CREATE OR REPLACE FUNCTION auto_update_service_visit_on_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- ตรวจสอบว่า status เปลี่ยนเป็น 'completed' หรือไม่
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- ถ้าเป็น service_visit_1
    IF NEW.service_type = 'visit_1' THEN
      UPDATE customer_services
      SET 
        service_visit_1 = true,
        service_visit_1_date = NEW.appointment_date::date,
        service_visit_1_date_thai = NEW.appointment_date_thai,
        service_visit_1_technician = COALESCE(NEW.technician_name, 'ไม่ระบุ'),
        updated_at = NOW(),
        updated_at_thai = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE id = NEW.customer_service_id
        AND service_visit_1 = false;  -- อัปเดตเฉพาะที่ยังไม่เสร็จ
    
    -- ถ้าเป็น service_visit_2
    ELSIF NEW.service_type = 'visit_2' THEN
      UPDATE customer_services
      SET 
        service_visit_2 = true,
        service_visit_2_date = NEW.appointment_date::date,
        service_visit_2_date_thai = NEW.appointment_date_thai,
        service_visit_2_technician = COALESCE(NEW.technician_name, 'ไม่ระบุ'),
        status = 'completed',  -- เปลี่ยนสถานะเป็นเสร็จสมบูรณ์
        updated_at = NOW(),
        updated_at_thai = NOW() AT TIME ZONE 'Asia/Bangkok'
      WHERE id = NEW.customer_service_id
        AND service_visit_2 = false;  -- อัปเดตเฉพาะที่ยังไม่เสร็จ
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- สร้าง Trigger ที่จะเรียก function เมื่อมีการ UPDATE
CREATE TRIGGER trigger_auto_update_service_visit
  AFTER UPDATE OF status ON service_appointments
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_service_visit_on_complete();

-- เพิ่ม comment
COMMENT ON FUNCTION auto_update_service_visit_on_complete() IS 
  'อัปเดต service_visit_1 หรือ service_visit_2 อัตโนมัติเมื่อช่างเปลี่ยน status เป็น completed';

COMMENT ON TRIGGER trigger_auto_update_service_visit ON service_appointments IS 
  'Trigger อัตโนมัติเมื่อ status เป็น completed';

-- =============================================================================
-- ✅ เสร็จสิ้น! Trigger ถูกสร้างแล้ว
-- =============================================================================

-- ทดสอบ: ดูว่า trigger ถูกสร้างแล้ว
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_update_service_visit';

-- =============================================================================
-- 📝 วิธีใช้งาน
-- =============================================================================

-- เมื่อช่างกด "เสร็จสิ้น" ใน UI:
-- 1. Frontend update status ของนัดหมาย:

-- UPDATE service_appointments 
-- SET status = 'completed'
-- WHERE id = 123;

-- 2. Trigger จะทำงานอัตโนมัติ:
--    ✅ อัปเดต service_visit_1 หรือ service_visit_2 เป็น true
--    ✅ บันทึกวันที่และช่างผู้รับผิดชอบ
--    ✅ ถ้าเป็น visit_2 จะเปลี่ยน status ลูกค้าเป็น 'completed'

-- =============================================================================
-- 🧪 ทดสอบ Trigger
-- =============================================================================

-- ตัวอย่างการทดสอบ (ดูไฟล์ TEST_TRIGGER.sql)

-- =============================================================================

