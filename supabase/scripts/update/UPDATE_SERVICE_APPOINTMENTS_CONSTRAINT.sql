-- =============================================================================
-- อัปเดต service_appointments constraint ให้รองรับ visit_3, 4, 5
-- =============================================================================

-- ลบ constraint เดิม
ALTER TABLE service_appointments 
DROP CONSTRAINT IF EXISTS service_appointments_service_type_check;

-- เพิ่ม constraint ใหม่ที่รองรับ visit_1-5
ALTER TABLE service_appointments 
ADD CONSTRAINT service_appointments_service_type_check 
CHECK (service_type IN ('visit_1', 'visit_2', 'visit_3', 'visit_4', 'visit_5'));

-- =============================================================================
-- ✅ เสร็จสิ้น! Constraint ถูกอัปเดตแล้ว
-- =============================================================================

-- ทดสอบ constraint ใหม่
SELECT 
  constraint_name,
  check_clause,
  '✅ Constraint อัปเดตสำเร็จ' as status
FROM information_schema.check_constraints
WHERE constraint_name = 'service_appointments_service_type_check';

-- =============================================================================
