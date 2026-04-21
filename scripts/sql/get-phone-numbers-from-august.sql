  -- Query: ดึงเบอร์โทรจากตาราง leads ตั้งแต่วันที่ 1 สิงหาคม ถึงปัจจุบัน
-- Usage: รัน query นี้ใน Supabase SQL Editor

-- วิธีที่ 1: ใช้ created_at_thai (แนะนำ - ง่ายต่อการกรองวันที่)
SELECT 
    id,
    tel,
    full_name,
    display_name,
    created_at_thai,
    platform,
    category,
    status
FROM leads
WHERE created_at_thai >= '2025-08-01 00:00:00+07'  -- วันที่ 1 สิงหาคม 2025 เวลา 00:00:00 (เวลาไทย)
  AND created_at_thai <= NOW()                        -- ถึงปัจจุบัน
  AND tel IS NOT NULL                                 -- กรองเฉพาะที่มีเบอร์โทร
  AND tel != ''                                       -- กรองเบอร์โทรที่ว่างเปล่า
ORDER BY created_at_thai DESC;

-- วิธีที่ 2: ใช้ created_at (UTC timezone)
-- SELECT 
--     id,
--     tel,
--     full_name,
--     display_name,
--     created_at,
--     created_at_thai,
--     platform,
--     category,
--     status
-- FROM leads
-- WHERE created_at >= '2025-08-01 00:00:00+07'::timestamptz
--   AND created_at <= NOW()
--   AND tel IS NOT NULL
--   AND tel != ''
-- ORDER BY created_at DESC;

-- ถ้าต้องการเฉพาะเบอร์โทรเท่านั้น (ไม่ต้องมีข้อมูลอื่น):
-- SELECT DISTINCT tel
-- FROM leads
-- WHERE created_at_thai >= '2025-08-01 00:00:00+07'
--   AND created_at_thai <= NOW()
--   AND tel IS NOT NULL
--   AND tel != ''
-- ORDER BY tel;

-- ถ้าต้องการนับจำนวนเบอร์โทร:
-- SELECT COUNT(DISTINCT tel) as total_phone_numbers
-- FROM leads
-- WHERE created_at_thai >= '2025-08-01 00:00:00+07'
--   AND created_at_thai <= NOW()
--   AND tel IS NOT NULL
--   AND tel != '';

-- ถ้าต้องการ export เบอร์โทรเป็น CSV format:
-- SELECT tel
-- FROM leads
-- WHERE created_at_thai >= '2025-08-01 00:00:00+07'
--   AND created_at_thai <= NOW()
--   AND tel IS NOT NULL
--   AND tel != ''
-- ORDER BY tel;





