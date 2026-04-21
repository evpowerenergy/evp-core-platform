-- =============================================================================
-- ตรวจสอบอีก 3 รายการที่ยังไม่ตรงกัน
-- =============================================================================
-- 
-- สถานการณ์:
-- - customer_services ที่ติดตามแล้ว + มี sale_follow_up_assigned_to = 92
-- - leads ที่มี post_sales_owner_id = 89
-- - ต่างกัน = 3 รายการ
-- =============================================================================

-- 1. ตรวจสอบ customer_services ที่ติดตามแล้วแต่ยังไม่มี lead
SELECT 
  COUNT(*) as without_lead,
  'customer_services ที่ติดตามแล้ว แต่ยังไม่มี lead' as description
FROM public.customer_services cs
WHERE cs.service_visit_1 = true
  AND cs.service_visit_2 = true
  AND cs.sale_follow_up_status = 'completed'
  AND cs.sale_follow_up_assigned_to IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.leads l 
    WHERE l.customer_service_id = cs.id
  );

-- 2. แสดงรายละเอียด customer_services ที่ยังไม่มี lead
SELECT 
  cs.id,
  cs.customer_group,
  cs.tel,
  cs.sale_follow_up_status,
  cs.sale_follow_up_assigned_to,
  cs.sale_follow_up_date,
  'ต้องสร้าง lead' as action
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
ORDER BY cs.id;

-- 3. ตรวจสอบ leads ที่มี customer_service_id แต่ไม่มี post_sales_owner_id
SELECT 
  COUNT(*) as leads_without_post_sales,
  'leads ที่มี customer_service_id แต่ยังไม่มี post_sales_owner_id' as description
FROM public.leads l
INNER JOIN public.customer_services cs ON l.customer_service_id = cs.id
WHERE cs.service_visit_1 = true
  AND cs.service_visit_2 = true
  AND cs.sale_follow_up_status = 'completed'
  AND cs.sale_follow_up_assigned_to IS NOT NULL
  AND l.post_sales_owner_id IS NULL;

-- 4. ตรวจสอบ leads ที่ post_sales_owner_id ไม่ตรงกับ sale_follow_up_assigned_to
SELECT 
  COUNT(*) as leads_mismatched,
  'leads ที่ post_sales_owner_id ไม่ตรงกับ sale_follow_up_assigned_to' as description
FROM public.leads l
INNER JOIN public.customer_services cs ON l.customer_service_id = cs.id
WHERE cs.service_visit_1 = true
  AND cs.service_visit_2 = true
  AND cs.sale_follow_up_status = 'completed'
  AND cs.sale_follow_up_assigned_to IS NOT NULL
  AND l.post_sales_owner_id IS NOT NULL
  AND l.post_sales_owner_id != cs.sale_follow_up_assigned_to;

-- 5. สรุปทั้งหมด
SELECT 
  'customer_services ที่ติดตามแล้ว + มี sale_follow_up_assigned_to' as category,
  COUNT(*) as count
FROM public.customer_services
WHERE service_visit_1 = true
  AND service_visit_2 = true
  AND sale_follow_up_status = 'completed'
  AND sale_follow_up_assigned_to IS NOT NULL

UNION ALL

SELECT 
  'customer_services ที่ติดตามแล้ว + มี sale_follow_up_assigned_to + มี lead' as category,
  COUNT(DISTINCT cs.id) as count
FROM public.customer_services cs
INNER JOIN public.leads l ON l.customer_service_id = cs.id
WHERE cs.service_visit_1 = true
  AND cs.service_visit_2 = true
  AND cs.sale_follow_up_status = 'completed'
  AND cs.sale_follow_up_assigned_to IS NOT NULL

UNION ALL

SELECT 
  'customer_services ที่ติดตามแล้ว + มี sale_follow_up_assigned_to + มี lead + lead มี post_sales_owner_id ตรง' as category,
  COUNT(DISTINCT cs.id) as count
FROM public.customer_services cs
INNER JOIN public.leads l ON l.customer_service_id = cs.id
WHERE cs.service_visit_1 = true
  AND cs.service_visit_2 = true
  AND cs.sale_follow_up_status = 'completed'
  AND cs.sale_follow_up_assigned_to IS NOT NULL
  AND l.post_sales_owner_id = cs.sale_follow_up_assigned_to

UNION ALL

SELECT 
  'leads ที่มี post_sales_owner_id' as category,
  COUNT(*) as count
FROM public.leads
WHERE post_sales_owner_id IS NOT NULL;

-- =============================================================================
-- สรุป
-- =============================================================================
-- 
-- ถ้า without_lead = 3 แสดงว่ายังมี customer_services ที่ติดตามแล้วแต่ยังไม่มี lead อยู่ 3 รายการ
-- ต้องสร้าง lead สำหรับ 3 รายการนี้
-- =============================================================================
