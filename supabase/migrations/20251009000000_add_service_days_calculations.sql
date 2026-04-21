-- เพิ่ม VIEW สำหรับคำนวณวันที่เกี่ยวกับ service
-- Logic: 
-- - Service Visit 1 ควรทำภายใน 365 วันนับจากวันติดตั้ง
-- - Service Visit 2 ควรทำภายใน 730 วันนับจากวันติดตั้ง
-- - หลังจาก Service Visit 2 เสร็จ ต้องติดตามหลังการขาย

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
  
  -- 4. หลัง 730 วันไปกี่วัน (สำหรับ Sale Follow-up)
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
