-- =============================================================================
-- 📋 Query สำหรับ Supabase SQL Editor
-- อัปเดต sale_follow_up_assigned_to จาก 13 เป็น 2
-- =============================================================================
-- 
-- วิธีการใช้:
-- 1. เปิด Supabase Dashboard → SQL Editor
-- 2. คัดลอก query ด้านล่างไปรัน
-- 3. ตรวจสอบผลลัพธ์
-- =============================================================================

-- ⚡ Query สำหรับอัปเดต (รัน query นี้)
UPDATE customer_services
SET 
  sale_follow_up_assigned_to = 2,
  updated_at = NOW(),
  updated_at_thai = NOW() + INTERVAL '7 hours'
WHERE sale_follow_up_assigned_to = 13;
