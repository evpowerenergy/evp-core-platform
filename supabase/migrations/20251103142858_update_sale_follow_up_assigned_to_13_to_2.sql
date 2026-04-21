-- =============================================================================
-- Migration: อัปเดต sale_follow_up_assigned_to จาก 13 เป็น 2
-- =============================================================================
-- 
-- วันที่: 2025-11-03
-- วัตถุประสงค์: เปลี่ยน sale_follow_up_assigned_to จาก id 13 เป็น id 2
-- ในตาราง customer_services
--
-- หมายเหตุ: customer_services_extended เป็น VIEW 
-- ดังนั้นต้องอัปเดตที่ตาราง customer_services จริง
-- =============================================================================

-- อัปเดตข้อมูล: เปลี่ยน sale_follow_up_assigned_to จาก 13 เป็น 2
UPDATE customer_services
SET 
  sale_follow_up_assigned_to = 2,
  updated_at = NOW(),
  updated_at_thai = NOW() + INTERVAL '7 hours'
WHERE sale_follow_up_assigned_to = 13;
