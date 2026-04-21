-- =============================================================================
-- SQL Query สำหรับรันบน Supabase UI
-- วัตถุประสงค์: สร้าง VIEW เพื่อคำนวณวันที่เกี่ยวกับ Service (แบบ Real-time)
-- คัดลอกทั้งหมดไปรันใน SQL Editor ของ Supabase
-- =============================================================================

-- สร้าง VIEW ที่คำนวณข้อมูล service days แบบ real-time
CREATE OR REPLACE VIEW customer_services_with_days AS
SELECT 
  cs.*,
  
  -- 1. จำนวนวันนับจากวันติดตั้ง
  CASE 
    WHEN cs.installation_date IS NOT NULL THEN
      (CURRENT_DATE - cs.installation_date::date)::INTEGER
    ELSE NULL
  END as days_since_installation,
  
  -- 2. วันที่เหลือจนถึงกำหนด Service Visit 1 (365 วัน)
  CASE 
    WHEN cs.installation_date IS NOT NULL AND cs.service_visit_1 = false THEN
      365 - (CURRENT_DATE - cs.installation_date::date)::INTEGER
    ELSE NULL
  END as days_until_service_1_due,
  
  -- 3. วันที่เหลือจนถึงกำหนด Service Visit 2 (730 วัน)
  CASE 
    WHEN cs.installation_date IS NOT NULL AND cs.service_visit_1 = true AND cs.service_visit_2 = false THEN
      730 - (CURRENT_DATE - cs.installation_date::date)::INTEGER
    ELSE NULL
  END as days_until_service_2_due,
  
  -- 4. หลัง 730 วันไปกี่วัน (สำหรับ Sale Follow-up) ⭐
  CASE 
    WHEN cs.installation_date IS NOT NULL AND cs.service_visit_1 = true AND cs.service_visit_2 = true THEN
      (CURRENT_DATE - cs.installation_date::date)::INTEGER - 730
    ELSE NULL
  END as days_after_service_complete,
  
  -- 5. สถานะ service ที่คำนวณอัตโนมัติ
  CASE 
    WHEN cs.installation_date IS NULL THEN 'not_installed'
    WHEN cs.service_visit_1 = false THEN
      CASE 
        WHEN (CURRENT_DATE - cs.installation_date::date)::INTEGER >= 365 THEN 'service_1_overdue'
        WHEN (CURRENT_DATE - cs.installation_date::date)::INTEGER >= 335 THEN 'service_1_due_soon'
        ELSE 'service_1_pending'
      END
    WHEN cs.service_visit_1 = true AND cs.service_visit_2 = false THEN
      CASE 
        WHEN (CURRENT_DATE - cs.installation_date::date)::INTEGER >= 730 THEN 'service_2_overdue'
        WHEN (CURRENT_DATE - cs.installation_date::date)::INTEGER >= 700 THEN 'service_2_due_soon'
        ELSE 'service_2_pending'
      END
    WHEN cs.service_visit_1 = true AND cs.service_visit_2 = true THEN 'service_complete'
    ELSE 'unknown'
  END as service_status_calculated
  
FROM customer_services cs;

-- เพิ่ม comment
COMMENT ON VIEW customer_services_with_days IS 'View ที่รวมข้อมูล customer_services พร้อมการคำนวณวันที่เกี่ยวกับ service แบบ real-time';

-- สร้าง indexes บน table เดิม เพื่อให้ VIEW query เร็วขึ้น
CREATE INDEX IF NOT EXISTS idx_customer_services_installation_date 
  ON customer_services(installation_date) 
  WHERE installation_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_services_service_visits 
  ON customer_services(service_visit_1, service_visit_2);

-- =============================================================================
-- ✅ เสร็จสิ้น! VIEW ถูกสร้างแล้ว
-- =============================================================================

-- ทดสอบดูผลลัพธ์:
SELECT 
  id,
  customer_group,
  installation_date,
  service_visit_1,
  service_visit_2,
  days_since_installation,
  days_after_service_complete,
  service_status_calculated
FROM customer_services_with_days
WHERE installation_date IS NOT NULL
ORDER BY days_since_installation DESC
LIMIT 10;

-- =============================================================================
-- 📝 วิธีใช้งาน:
-- =============================================================================

-- ใช้ VIEW แทน table ธรรมดา:
-- ❌ เดิม: SELECT * FROM customer_services
-- ✅ ใหม่: SELECT * FROM customer_services_with_days

-- ตัวอย่างการใช้งาน:

-- 1. ดูลูกค้าที่บริการครบแล้ว
SELECT 
  customer_group,
  tel,
  days_after_service_complete,
  service_status_calculated
FROM customer_services_with_days
WHERE service_visit_1 = true 
  AND service_visit_2 = true
ORDER BY days_after_service_complete DESC;

-- 2. Filter ลูกค้าที่ควรติดตาม (บริการครบมากกว่า 90 วัน)
SELECT *
FROM customer_services_with_days
WHERE days_after_service_complete > 90
ORDER BY days_after_service_complete DESC;

-- 3. ใช้ใน Frontend (Supabase Client)
-- const { data } = await supabase
--   .from('customer_services_with_days')
--   .select('*')
--   .eq('service_visit_1', true)
--   .eq('service_visit_2', true);

-- =============================================================================

