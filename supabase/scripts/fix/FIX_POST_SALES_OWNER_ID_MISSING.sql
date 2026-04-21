-- =============================================================================
-- แก้ไขปัญหา: customer_services ที่ติดตามแล้วแต่ยังไม่มี post_sales_owner_id ใน leads
-- =============================================================================
-- 
-- ปัญหา:
-- - customer_services ที่ sale_follow_up_status = 'completed' = 92 รายการ
-- - แต่ leads ที่มี post_sales_owner_id = 74 รายการ
-- - ต่างกัน 18 รายการ (92 - 74 = 18)
--
-- วิธีแก้:
-- - อัปเดต post_sales_owner_id สำหรับ leads ที่มี customer_service_id 
--   แต่ยังไม่มี post_sales_owner_id และ customer_services มี sale_follow_up_status = 'completed'
-- =============================================================================

-- ขั้นตอนที่ 1: ตรวจสอบก่อนว่ามีกี่รายการที่ต้องแก้
SELECT 
  COUNT(*) as leads_to_update,
  'leads ที่มี customer_service_id แต่ยังไม่มี post_sales_owner_id' as description
FROM public.leads l
INNER JOIN public.customer_services cs ON l.customer_service_id = cs.id
WHERE l.operation_status = 'ติดตามหลังการขาย'
  AND cs.sale_follow_up_assigned_to IS NOT NULL
  AND (l.post_sales_owner_id IS NULL OR l.post_sales_owner_id != cs.sale_follow_up_assigned_to);

-- ขั้นตอนที่ 2: อัปเดต post_sales_owner_id สำหรับ leads ที่มี customer_service_id แล้ว
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

-- ขั้นตอนที่ 3: สร้าง leads สำหรับ customer_services ที่ติดตามแล้วแต่ยังไม่มี lead
-- (ถ้าต้องการ - แต่ควรระวังว่าอาจจะสร้าง lead ซ้ำได้)

-- ตรวจสอบ customer_services ที่ติดตามแล้วแต่ยังไม่มี lead
SELECT 
  cs.id,
  cs.customer_group,
  cs.tel,
  cs.sale_follow_up_status,
  cs.sale_follow_up_assigned_to,
  cs.sale_follow_up_date
FROM public.customer_services cs
WHERE cs.service_visit_1 = true
  AND cs.service_visit_2 = true
  AND cs.sale_follow_up_status = 'completed'
  AND cs.sale_follow_up_assigned_to IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.leads l 
    WHERE l.customer_service_id = cs.id
  )
ORDER BY cs.id
LIMIT 20;

-- =============================================================================
-- ตรวจสอบผลลัพธ์หลังอัปเดต
-- =============================================================================

-- นับ leads ที่มี post_sales_owner_id
SELECT 
  COUNT(*) as total_leads_with_post_sales_owner,
  COUNT(DISTINCT post_sales_owner_id) as unique_sales_assigned
FROM public.leads
WHERE post_sales_owner_id IS NOT NULL;

-- เปรียบเทียบกับ customer_services ที่ติดตามแล้ว
SELECT 
  cs_count.count as customer_services_completed,
  lead_count.count as leads_with_post_sales_owner,
  (cs_count.count - lead_count.count) as difference
FROM (
  SELECT COUNT(*) as count
  FROM public.customer_services_extended
  WHERE service_visit_1 = true
    AND service_visit_2 = true
    AND sale_follow_up_status = 'completed'
) cs_count
CROSS JOIN (
  SELECT COUNT(*) as count
  FROM public.leads
  WHERE post_sales_owner_id IS NOT NULL
) lead_count;

-- =============================================================================
-- สรุป
-- =============================================================================
-- 
-- ถ้ายังต่างกัน แสดงว่ามี customer_services ที่ติดตามแล้วแต่ยังไม่ได้สร้าง lead
-- ในกรณีนี้ต้องเรียก create_lead_from_customer_service() สำหรับ customer_services เหล่านั้น
-- หรือสร้าง lead เอง
-- =============================================================================
