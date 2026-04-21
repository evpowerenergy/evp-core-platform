-- =============================================================================
-- วิธีที่ 2: ใช้ ALTER VIEW (ซับซ้อนกว่า แต่ไม่ต้องลบ VIEW)
-- =============================================================================

-- 1. เพิ่ม columns ใหม่ทีละตัว
ALTER VIEW customer_services_extended 
ADD COLUMN days_since_installation INTEGER;

ALTER VIEW customer_services_extended 
ADD COLUMN days_until_service_1_due INTEGER;

ALTER VIEW customer_services_extended 
ADD COLUMN days_until_service_2_due INTEGER;

ALTER VIEW customer_services_extended 
ADD COLUMN days_after_service_complete INTEGER;

ALTER VIEW customer_services_extended 
ADD COLUMN service_status_calculated TEXT;

-- 2. อัปเดต VIEW definition ให้คำนวณ values
CREATE OR REPLACE VIEW customer_services_extended AS
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
  END as service_status_calculated,
  
  -- 6. นับจำนวน visit ที่เสร็จแล้ว
  (
    CASE WHEN cs.service_visit_1 = true THEN 1 ELSE 0 END +
    CASE WHEN cs.service_visit_2 = true THEN 1 ELSE 0 END +
    CASE WHEN cs.service_visit_3 = true THEN 1 ELSE 0 END +
    CASE WHEN cs.service_visit_4 = true THEN 1 ELSE 0 END +
    CASE WHEN cs.service_visit_5 = true THEN 1 ELSE 0 END
  ) as completed_visits_count,
  
  -- 7. นับจำนวน visit ที่เหลือ
  (
    5 - (
      CASE WHEN cs.service_visit_1 = true THEN 1 ELSE 0 END +
      CASE WHEN cs.service_visit_2 = true THEN 1 ELSE 0 END +
      CASE WHEN cs.service_visit_3 = true THEN 1 ELSE 0 END +
      CASE WHEN cs.service_visit_4 = true THEN 1 ELSE 0 END +
      CASE WHEN cs.service_visit_5 = true THEN 1 ELSE 0 END
    )
  ) as remaining_visits_count

FROM customer_services cs;
