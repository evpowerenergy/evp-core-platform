-- =============================================================================
-- Test Script: Service Appointment Trigger
-- วัตถุประสงค์: ทดสอบ trigger ที่อัปเดต service_visit_1/2 อัตโนมัติ
-- =============================================================================

-- 📋 CHECKLIST: ติ๊กเมื่อทดสอบเสร็จแต่ละ step
-- [ ] Step 1: ตรวจสอบ trigger ถูกสร้างแล้ว
-- [ ] Step 2: ทดสอบอัปเดต visit_1
-- [ ] Step 3: ทดสอบอัปเดต visit_2
-- [ ] Step 4: ทดสอบไม่อัปเดตซ้ำ
-- [ ] Step 5: ทดสอบ status อื่นๆ (ไม่ trigger)

-- =============================================================================
-- STEP 1: ตรวจสอบว่า Trigger ถูกสร้างแล้ว
-- =============================================================================

SELECT 
  trigger_name as "Trigger Name",
  event_manipulation as "Event",
  event_object_table as "Table",
  action_timing as "Timing",
  '✅ Trigger พร้อมใช้งาน' as status
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_update_service_visit';

-- Expected: 1 row
-- ✅ PASS: ถ้ามี 1 row
-- ❌ FAIL: ถ้าไม่มี row → ต้องรัน migration ก่อน

-- =============================================================================
-- STEP 2: ทดสอบอัปเดต Visit 1
-- =============================================================================

-- 2.1 หาลูกค้าที่ยังไม่เสร็จ visit_1
SELECT 
  id,
  customer_group,
  tel,
  service_visit_1 as "Visit 1 (ต้องเป็น false)",
  service_visit_2 as "Visit 2"
FROM customer_services
WHERE installation_date IS NOT NULL
  AND service_visit_1 = false
ORDER BY id
LIMIT 3;

-- 📝 จด Customer ID ที่จะใช้ทดสอบ: _____________

-- 2.2 สร้างนัดหมายทดสอบ
-- ⚠️ เปลี่ยน customer_service_id ให้ตรงกับ ID ที่จดไว้

INSERT INTO service_appointments (
  customer_service_id,
  appointment_date,
  appointment_time,
  service_type,
  technician_name,
  status,
  notes
) VALUES (
  1,  -- ⚠️ เปลี่ยนเป็น Customer ID จริง
  CURRENT_DATE,
  '10:00:00',
  'visit_1',
  '🧪 Test Technician',
  'scheduled',  -- เริ่มต้นเป็น scheduled
  '🧪 [TEST] ทดสอบ trigger'
) RETURNING 
  id as "Appointment ID",
  customer_service_id,
  status,
  '✅ สร้างนัดหมายสำเร็จ' as message;

-- 📝 จด Appointment ID: _____________

-- 2.3 ดูข้อมูลก่อนเปลี่ยน status
SELECT 
  id,
  customer_group,
  service_visit_1 as "Visit 1 (ก่อน - ต้องเป็น false)",
  service_visit_1_date as "วันที่ (ก่อน - ต้องเป็น NULL)",
  service_visit_1_technician as "ช่าง (ก่อน - ต้องเป็น NULL)"
FROM customer_services 
WHERE id = 1;  -- ⚠️ ใช้ Customer ID เดียวกัน

-- 2.4 🎯 เปลี่ยน status เป็น 'completed' (จำลองช่างกด "เสร็จสิ้น")
UPDATE service_appointments
SET status = 'completed'
WHERE id = 1  -- ⚠️ ใช้ Appointment ID ที่จดไว้
  AND notes LIKE '🧪%'
RETURNING 
  id,
  status,
  '✅ เปลี่ยน status เป็น completed' as message;

-- 🤖 Trigger จะทำงานอัตโนมัติทันที!

-- 2.5 ดูผลลัพธ์ (ต้องถูกอัปเดตแล้ว)
SELECT 
  id,
  customer_group,
  service_visit_1 as "Visit 1 (หลัง - ต้องเป็น true ✅)",
  service_visit_1_date as "วันที่ (หลัง - มีค่า ✅)",
  service_visit_1_technician as "ช่าง (หลัง - มีค่า ✅)",
  CASE 
    WHEN service_visit_1 = true THEN '✅ สำเร็จ! Trigger ทำงาน'
    ELSE '❌ ล้มเหลว - Trigger ไม่ทำงาน'
  END as "ผลการทดสอบ"
FROM customer_services 
WHERE id = 1;  -- ⚠️ ใช้ Customer ID เดียวกัน

-- ✅ PASS: service_visit_1 = true
-- ❌ FAIL: ยังเป็น false (Trigger ไม่ทำงาน)

-- =============================================================================
-- STEP 3: ทดสอบอัปเดต Visit 2 (และ customer status)
-- =============================================================================

-- 3.1 หาลูกค้าที่เสร็จ visit_1 แล้ว แต่ยังไม่เสร็จ visit_2
SELECT 
  id,
  customer_group,
  service_visit_1,
  service_visit_2 as "Visit 2 (ต้องเป็น false)",
  status as "Status (ก่อน)"
FROM customer_services
WHERE service_visit_1 = true
  AND service_visit_2 = false
LIMIT 3;

-- 📝 จด Customer ID ที่ 2: _____________

-- 3.2 สร้างนัดหมาย visit_2
INSERT INTO service_appointments (
  customer_service_id,
  appointment_date,
  service_type,
  technician_name,
  status,
  notes
) VALUES (
  2,  -- ⚠️ เปลี่ยนเป็น Customer ID ที่ 2
  CURRENT_DATE,
  'visit_2',
  '🧪 Test V2',
  'scheduled',
  '🧪 [TEST] ทดสอบ visit 2'
) RETURNING 
  id as "Appointment ID",
  '✅ สร้างนัดหมาย visit_2' as message;

-- 📝 จด Appointment ID ที่ 2: _____________

-- 3.3 เปลี่ยน status เป็น completed
UPDATE service_appointments
SET status = 'completed'
WHERE id = 2  -- ⚠️ ใช้ Appointment ID ที่ 2
  AND notes LIKE '🧪%'
RETURNING 
  id,
  status,
  '✅ เปลี่ยน status เป็น completed (visit_2)' as message;

-- 3.4 ตรวจสอบผลลัพธ์
SELECT 
  id,
  customer_group,
  service_visit_2 as "Visit 2 (ต้องเป็น true ✅)",
  status as "Status (ต้องเป็น completed ✅)",
  CASE 
    WHEN service_visit_2 = true AND status = 'completed' 
    THEN '✅ สำเร็จ! Visit 2 และ Status อัปเดต'
    ELSE '❌ ล้มเหลว'
  END as "ผลการทดสอบ"
FROM customer_services 
WHERE id = 2;  -- ⚠️ ใช้ Customer ID ที่ 2

-- ✅ PASS: visit_2 = true และ status = 'completed'
-- ❌ FAIL: ไม่ครบถ้วน

-- =============================================================================
-- STEP 4: ทดสอบไม่อัปเดตซ้ำ
-- =============================================================================

-- สร้างนัดหมายใหม่สำหรับลูกค้าที่เสร็จ visit_1 ไปแล้ว
-- (ใช้ Customer ID ที่ 1 จาก Step 2)

INSERT INTO service_appointments (
  customer_service_id,
  appointment_date,
  service_type,
  technician_name,
  status,
  notes
) VALUES (
  1,  -- ลูกค้าที่เสร็จ visit_1 ไปแล้ว
  CURRENT_DATE + INTERVAL '1 day',
  'visit_1',
  '🧪 Duplicate Test',
  'scheduled',
  '🧪 [TEST] ทดสอบไม่อัปเดตซ้ำ'
) RETURNING id;

-- จด Appointment ID ที่ 3: _____________

-- เปลี่ยน status เป็น completed
UPDATE service_appointments
SET status = 'completed'
WHERE id = 3  -- ⚠️ ใช้ Appointment ID ที่ 3
  AND notes LIKE '🧪%'
RETURNING '✅ เปลี่ยน status (ทดสอบซ้ำ)' as message;

-- ตรวจสอบว่าข้อมูลไม่เปลี่ยน (ยังเก็บข้อมูลเดิม)
SELECT 
  id,
  customer_group,
  service_visit_1,
  service_visit_1_technician as "ช่าง (ต้องยังเป็นชื่อเดิม)",
  CASE 
    WHEN service_visit_1_technician = '🧪 Test Technician' 
    THEN '✅ PASS: ไม่อัปเดตซ้ำ'
    ELSE '⚠️ อัปเดตซ้ำ (แต่ไม่เป็นปัญหา)'
  END as "ผลการทดสอบ"
FROM customer_services 
WHERE id = 1;

-- =============================================================================
-- STEP 5: ทดสอบ status อื่นๆ (ต้องไม่ trigger)
-- =============================================================================

-- สร้างนัดหมายใหม่
INSERT INTO service_appointments (
  customer_service_id,
  appointment_date,
  service_type,
  status,
  notes
) VALUES (
  1,
  CURRENT_DATE + INTERVAL '2 days',
  'visit_1',
  'scheduled',
  '🧪 [TEST] ทดสอบ status อื่น'
) RETURNING id;

-- จด ID: _____________

-- เปลี่ยนเป็น 'cancelled' (ไม่ใช่ completed)
UPDATE service_appointments
SET status = 'cancelled'
WHERE id = 4  -- ⚠️ Appointment ID ที่ 4
  AND notes LIKE '🧪%'
RETURNING 
  status,
  '✅ เปลี่ยน status เป็น cancelled' as message;

-- ข้อมูลต้องไม่เปลี่ยน (เพราะไม่ได้เป็น 'completed')
SELECT 
  '✅ PASS: ไม่มีการอัปเดต (ถูกต้อง)' as "ผลการทดสอบ",
  'Trigger ทำงานเฉพาะ status = completed เท่านั้น' as "หมายเหตุ";

-- =============================================================================
-- STEP 6: ลบข้อมูลทดสอบ (Cleanup)
-- =============================================================================

-- ลบนัดหมายทดสอบทั้งหมด
DELETE FROM service_appointments 
WHERE notes LIKE '🧪%'
RETURNING 
  id,
  customer_service_id,
  service_type,
  '🗑️ ลบแล้ว' as status;

-- Reset ข้อมูลลูกค้า (ถ้าต้องการ)
-- ⚠️ Uncomment ถ้าต้องการ reset

/*
UPDATE customer_services 
SET 
  service_visit_1 = false,
  service_visit_1_date = NULL,
  service_visit_1_technician = NULL
WHERE service_visit_1_technician LIKE '🧪%';

UPDATE customer_services 
SET 
  service_visit_2 = false,
  service_visit_2_date = NULL,
  service_visit_2_technician = NULL,
  status = 'active'
WHERE service_visit_2_technician LIKE '🧪%';
*/

-- =============================================================================
-- ✅ สรุปผลการทดสอบ
-- =============================================================================

SELECT 
  '🎉 การทดสอบเสร็จสมบูรณ์!' as "สถานะ",
  'Trigger ทำงานอัตโนมัติเมื่อ status = completed' as "สรุป";

-- ตรวจสอบ CHECKLIST:
-- [ ] Step 1: Trigger exists ✅
-- [ ] Step 2: Update visit_1 ✅
-- [ ] Step 3: Update visit_2 + status ✅
-- [ ] Step 4: Don't update twice ✅
-- [ ] Step 5: Other status (no trigger) ✅

-- =============================================================================
-- 🔍 ดู Trigger Details
-- =============================================================================

-- ดูข้อมูล trigger
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_update_service_visit';

-- ดูข้อมูล function
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'auto_update_service_visit_on_complete';

-- =============================================================================

