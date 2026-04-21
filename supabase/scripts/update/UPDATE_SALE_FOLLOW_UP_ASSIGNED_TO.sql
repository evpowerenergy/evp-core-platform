-- =============================================================================
-- อัปเดต sale_follow_up_assigned_to จาก 13 เป็น 2
-- =============================================================================
-- 
-- วัตถุประสงค์: เปลี่ยน sale_follow_up_assigned_to จาก id 13 เป็น id 2
-- ในตาราง customer_services
--
-- หมายเหตุ: customer_services_extended เป็น VIEW 
-- ดังนั้นต้องอัปเดตที่ตาราง customer_services จริง
-- =============================================================================

-- ตรวจสอบจำนวนข้อมูลที่จะถูกอัปเดตก่อน
SELECT 
  COUNT(*) as records_to_update,
  sale_follow_up_assigned_to
FROM customer_services
WHERE sale_follow_up_assigned_to = 13
GROUP BY sale_follow_up_assigned_to;

-- อัปเดตข้อมูล: เปลี่ยน sale_follow_up_assigned_to จาก 13 เป็น 2
UPDATE customer_services
SET 
  sale_follow_up_assigned_to = 2,
  updated_at = NOW(),
  updated_at_thai = NOW() + INTERVAL '7 hours'
WHERE sale_follow_up_assigned_to = 13;

-- ตรวจสอบผลลัพธ์หลังอัปเดต
SELECT 
  COUNT(*) as updated_records,
  sale_follow_up_assigned_to
FROM customer_services
WHERE sale_follow_up_assigned_to IN (2, 13)
GROUP BY sale_follow_up_assigned_to
ORDER BY sale_follow_up_assigned_to;

-- แสดงตัวอย่างข้อมูลที่ถูกอัปเดต (แสดง 10 รายการแรก)
SELECT 
  id,
  tel,
  customer_group,
  sale_follow_up_assigned_to,
  sale_follow_up_status,
  sale_follow_up_date,
  updated_at
FROM customer_services
WHERE sale_follow_up_assigned_to = 2
ORDER BY updated_at DESC
LIMIT 10;

-- =============================================================================
-- ✅ เสร็จสิ้น! อัปเดตข้อมูลแล้ว
-- =============================================================================
