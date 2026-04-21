-- =============================================================================
-- Query สำหรับรันใน Supabase SQL Editor
-- อัปเดต sale_follow_up_assigned_to จาก 13 เป็น 2
-- =============================================================================

-- ✅ ขั้นตอนที่ 1: ตรวจสอบข้อมูลที่จะถูกอัปเดต (รันก่อนเพื่อดูจำนวน)
SELECT 
  COUNT(*) as records_to_update,
  sale_follow_up_assigned_to
FROM customer_services
WHERE sale_follow_up_assigned_to = 13
GROUP BY sale_follow_up_assigned_to;

-- ⚠️ ขั้นตอนที่ 2: อัปเดตข้อมูล (รันเมื่อพร้อม)
-- UPDATE customer_services
-- SET 
--   sale_follow_up_assigned_to = 2,
--   updated_at = NOW(),
--   updated_at_thai = NOW() + INTERVAL '7 hours'
-- WHERE sale_follow_up_assigned_to = 13;

-- ✅ ขั้นตอนที่ 3: ตรวจสอบผลลัพธ์หลังอัปเดต (รันหลัง UPDATE)
-- SELECT 
--   COUNT(*) as updated_records,
--   sale_follow_up_assigned_to
-- FROM customer_services
-- WHERE sale_follow_up_assigned_to IN (2, 13)
-- GROUP BY sale_follow_up_assigned_to
-- ORDER BY sale_follow_up_assigned_to;

-- ✅ ขั้นตอนที่ 4: ดูตัวอย่างข้อมูลที่ถูกอัปเดต (10 รายการล่าสุด)
-- SELECT 
--   id,
--   tel,
--   customer_group,
--   sale_follow_up_assigned_to,
--   sale_follow_up_status,
--   sale_follow_up_date,
--   updated_at
-- FROM customer_services
-- WHERE sale_follow_up_assigned_to = 2
-- ORDER BY updated_at DESC
-- LIMIT 10;
