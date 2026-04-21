-- =============================================================================
-- Query สำหรับตรวจสอบ: ทำไมจำนวน "ติดตามแล้ว" ไม่ตรงกัน
-- =============================================================================
-- 
-- ปัญหา:
-- - Query นับ leads ที่มี post_sales_owner_id = 74
-- - แต่หน้าเว็บแสดง "ติดตามแล้ว" = 92
--
-- สาเหตุที่เป็นไปได้:
-- 1. "ติดตามแล้ว" นับจาก customer_services.sale_follow_up_status = 'completed'
-- 2. แต่ไม่ใช่ทุก customer_services ที่มี sale_follow_up_status = 'completed' 
--    จะถูกสร้าง lead (หรือมี post_sales_owner_id)
-- =============================================================================

-- 1. นับ customer_services ที่มี sale_follow_up_status = 'completed'
SELECT 
  COUNT(*) as total_completed_follow_up,
  'customer_services ที่ติดตามแล้ว' as description
FROM public.customer_services_extended
WHERE service_visit_1 = true
  AND service_visit_2 = true
  AND sale_follow_up_status = 'completed';

-- 2. นับ leads ที่มี post_sales_owner_id
SELECT 
  COUNT(*) as total_leads_with_post_sales_owner,
  'leads ที่มี post_sales_owner_id' as description
FROM public.leads
WHERE post_sales_owner_id IS NOT NULL;

-- 3. นับ customer_services ที่มี sale_follow_up_status = 'completed' 
--    แต่ยังไม่มี lead (ไม่มี customer_service_id ใน leads)
SELECT 
  COUNT(DISTINCT cs.id) as completed_but_no_lead,
  'customer_services ที่ติดตามแล้วแต่ยังไม่มี lead' as description
FROM public.customer_services cs
WHERE cs.service_visit_1 = true
  AND cs.service_visit_2 = true
  AND cs.sale_follow_up_status = 'completed'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.leads l 
    WHERE l.customer_service_id = cs.id
  );

-- 4. เปรียบเทียบ: customer_services ที่ติดตามแล้ว vs leads ที่มี post_sales_owner_id
SELECT 
  cs_count.count as customer_services_completed,
  lead_count.count as leads_with_post_sales_owner,
  (cs_count.count - lead_count.count) as difference,
  'เปรียบเทียบ' as description
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

-- 5. แสดงรายละเอียด: customer_services ที่ติดตามแล้วแต่ยังไม่มี lead
SELECT 
  cs.id,
  cs.customer_group,
  cs.tel,
  cs.sale_follow_up_status,
  cs.sale_follow_up_assigned_to,
  cs.sale_follow_up_date,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.leads l 
      WHERE l.customer_service_id = cs.id
    ) THEN 'มี lead แล้ว'
    ELSE 'ยังไม่มี lead'
  END as has_lead
FROM public.customer_services cs
WHERE cs.service_visit_1 = true
  AND cs.service_visit_2 = true
  AND cs.sale_follow_up_status = 'completed'
ORDER BY cs.id
LIMIT 20;

-- =============================================================================
-- สรุป
-- =============================================================================
-- 
-- ถ้า "ติดตามแล้ว" = 92 แต่ leads ที่มี post_sales_owner_id = 74
-- แสดงว่ามี customer_services ที่ติดตามแล้ว 18 รายการ (92 - 74 = 18)
-- ที่ยังไม่ได้สร้าง lead หรือยังไม่มี post_sales_owner_id
--
-- สาเหตุที่เป็นไปได้:
-- 1. customer_services ที่ติดตามแล้วก่อนที่จะเพิ่ม field post_sales_owner_id
-- 2. customer_services ที่ติดตามแล้วแต่ไม่ได้เรียก create_lead_from_customer_service()
-- 3. customer_services ที่สร้าง lead แล้วแต่ไม่ได้อัปเดต post_sales_owner_id
-- =============================================================================
