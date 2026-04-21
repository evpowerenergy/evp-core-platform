-- =============================================================================
-- อัปเดต customer_services_extended VIEW เพื่อเพิ่ม fields สำหรับคำนวณวันที่
-- =============================================================================

-- ลบ VIEW เดิมก่อน (เพราะมี columns ที่แตกต่างกัน)
DROP VIEW IF EXISTS customer_services_extended;

-- สร้าง VIEW ใหม่ที่รวม fields ทั้งหมด
CREATE VIEW customer_services_extended AS
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

-- เพิ่ม comment
COMMENT ON VIEW customer_services_extended IS 'View ที่รวมข้อมูล customer_services พร้อมการคำนวณวันที่และจำนวน visits แบบ real-time';

-- =============================================================================
-- ✅ เสร็จสิ้น! VIEW ถูกอัปเดตแล้ว
-- =============================================================================

-- ทดสอบดูผลลัพธ์:
SELECT 
  id,
  customer_group,
  installation_date,
  service_visit_1,
  service_visit_2,
  service_visit_3,
  service_visit_4,
  service_visit_5,
  days_since_installation,
  days_until_service_1_due,
  days_until_service_2_due,
  days_after_service_complete,
  completed_visits_count,
  remaining_visits_count,
  service_status_calculated
FROM customer_services_extended
WHERE installation_date IS NOT NULL
ORDER BY days_since_installation DESC
LIMIT 10;
