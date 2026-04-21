-- =============================================================================
-- Migration 2: อัปเดตข้อมูลจาก sale_follow_up_assigned_to มาใส่ใน post_sales_owner_id
-- =============================================================================
-- 
-- วัตถุประสงค์: 
-- - หา leads ที่มี customer_service_id และ operation_status = 'ติดตามหลังการขาย'
-- - อัปเดต post_sales_owner_id จาก customer_services.sale_follow_up_assigned_to
--
-- หมายเหตุ: Migration นี้จะอัปเดตเฉพาะ leads ที่มี customer_service_id แล้ว
-- สำหรับ leads ที่จะสร้างใหม่จะถูกจัดการโดย function create_lead_from_customer_service()
-- =============================================================================

-- อัปเดต post_sales_owner_id จาก sale_follow_up_assigned_to
UPDATE public.leads l
SET 
  post_sales_owner_id = cs.sale_follow_up_assigned_to,
  updated_at = NOW(),
  updated_at_thai = NOW() + INTERVAL '7 hours'
FROM public.customer_services cs
WHERE l.customer_service_id = cs.id
  AND l.operation_status = 'ติดตามหลังการขาย'
  AND cs.sale_follow_up_assigned_to IS NOT NULL
  AND (l.post_sales_owner_id IS NULL OR l.post_sales_owner_id != cs.sale_follow_up_assigned_to);

-- แสดงจำนวน leads ที่ถูกอัปเดต (สำหรับตรวจสอบ)
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM public.leads l
  INNER JOIN public.customer_services cs ON l.customer_service_id = cs.id
  WHERE l.operation_status = 'ติดตามหลังการขาย'
    AND cs.sale_follow_up_assigned_to IS NOT NULL
    AND l.post_sales_owner_id = cs.sale_follow_up_assigned_to;
  
  RAISE NOTICE 'Updated % leads with post_sales_owner_id from sale_follow_up_assigned_to', updated_count;
END $$;

-- =============================================================================
-- ✅ เสร็จสิ้น Migration 2: อัปเดตข้อมูลแล้ว
-- =============================================================================
-- 
-- ขั้นตอนต่อไป:
-- - Migration 3: แก้ไข function create_lead_from_customer_service()
-- =============================================================================
