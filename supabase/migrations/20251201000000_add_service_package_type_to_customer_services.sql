-- =============================================================================
-- เพิ่ม column service_package_type ใน customer_services table
-- =============================================================================

-- เพิ่ม column service_package_type
ALTER TABLE customer_services
ADD COLUMN IF NOT EXISTS service_package_type TEXT 
  CHECK (service_package_type IN ('1_year', '3_year', '5_year')) 
  NULL;

-- เพิ่ม comment
COMMENT ON COLUMN customer_services.service_package_type IS 
  'ประเภทแพ็คเกจ service ที่ลูกค้าซื้อ: 1_year (1 ปี), 3_year (3 ปี), 5_year (5 ปี)';

-- =============================================================================
-- อัพเดท VIEW customer_services_extended เพื่อรวม field service_package_type
-- =============================================================================

-- ลบ VIEW เดิมก่อน (เพราะมี columns ที่แตกต่างกัน)
DROP VIEW IF EXISTS customer_services_extended;

-- สร้าง VIEW ใหม่ที่รวม fields ทั้งหมดรวมถึง service_package_type
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
COMMENT ON VIEW customer_services_extended IS 
  'View ที่รวมข้อมูล customer_services พร้อมการคำนวณวันที่และจำนวน visits แบบ real-time รวมถึง service_package_type';

-- =============================================================================
-- สร้างตาราง customer_service_purchases สำหรับเก็บประวัติการซื้อ service package
-- =============================================================================

CREATE TABLE IF NOT EXISTS customer_service_purchases (
  id SERIAL PRIMARY KEY,
  customer_service_id INTEGER NOT NULL REFERENCES customer_services(id) ON DELETE CASCADE,
  service_package_type TEXT NOT NULL CHECK (service_package_type IN ('1_year', '3_year', '5_year')),
  purchase_date DATE NOT NULL,
  purchase_date_thai TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_at_thai TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at_thai TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')
);

-- สร้าง indexes สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_customer_service_purchases_customer_service_id 
  ON customer_service_purchases(customer_service_id);
CREATE INDEX IF NOT EXISTS idx_customer_service_purchases_status 
  ON customer_service_purchases(status);
CREATE INDEX IF NOT EXISTS idx_customer_service_purchases_purchase_date 
  ON customer_service_purchases(purchase_date);

-- เพิ่ม comment
COMMENT ON TABLE customer_service_purchases IS 
  'ตารางเก็บประวัติการซื้อ service package ของลูกค้า';
COMMENT ON COLUMN customer_service_purchases.customer_service_id IS 
  'ID ของ customer_services ที่ซื้อ package นี้';
COMMENT ON COLUMN customer_service_purchases.service_package_type IS 
  'ประเภทแพ็คเกจ: 1_year (1 ปี), 3_year (3 ปี), 5_year (5 ปี)';
COMMENT ON COLUMN customer_service_purchases.purchase_date IS 
  'วันที่ซื้อ package (ดูจาก installation_date หรือวันที่ซื้อจริง)';
COMMENT ON COLUMN customer_service_purchases.status IS 
  'สถานะ: active (กำลังใช้งาน), completed (เสร็จสิ้น), cancelled (ยกเลิก)';

-- Enable RLS
ALTER TABLE customer_service_purchases ENABLE ROW LEVEL SECURITY;

-- สร้าง RLS policies
CREATE POLICY "Allow authenticated users to view purchases"
  ON customer_service_purchases
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create purchases"
  ON customer_service_purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update purchases"
  ON customer_service_purchases
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete purchases"
  ON customer_service_purchases
  FOR DELETE
  TO authenticated
  USING (true);

-- สร้าง trigger สำหรับอัพเดท updated_at
CREATE TRIGGER update_customer_service_purchases_updated_at
  BEFORE UPDATE ON customer_service_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

