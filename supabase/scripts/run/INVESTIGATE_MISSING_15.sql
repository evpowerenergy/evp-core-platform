-- =============================================================================
-- ตรวจสอบ: ทำไมยังต่างกัน 15 รายการ (18 - 3 = 15)
-- =============================================================================
-- 
-- สถานการณ์:
-- - customer_services ที่ติดตามแล้ว (completed) = 92
-- - leads ที่มี post_sales_owner_id = 74
-- - ต่างกัน = 18 รายการ
-- - customer_services ที่ติดตามแล้วแต่ยังไม่มี lead = 3 รายการ
--
-- คำถาม: อีก 15 รายการคืออะไร?
-- =============================================================================

-- 1. ตรวจสอบ customer_services ที่ติดตามแล้วแต่ sale_follow_up_assigned_to = NULL
SELECT 
  COUNT(*) as completed_but_no_assigned_to,
  'customer_services ที่ติดตามแล้วแต่ไม่มี sale_follow_up_assigned_to' as description
FROM public.customer_services
WHERE service_visit_1 = true
  AND service_visit_2 = true
  AND sale_follow_up_status = 'completed'
  AND sale_follow_up_assigned_to IS NULL;

-- 2. ตรวจสอบ leads ที่มี customer_service_id แต่ไม่มี post_sales_owner_id
--    (แม้ว่า customer_services จะมี sale_follow_up_assigned_to)
SELECT 
  COUNT(*) as leads_without_post_sales_owner,
  'leads ที่มี customer_service_id แต่ยังไม่มี post_sales_owner_id' as description
FROM public.leads l
INNER JOIN public.customer_services cs ON l.customer_service_id = cs.id
WHERE l.operation_status = 'ติดตามหลังการขาย'
  AND cs.sale_follow_up_assigned_to IS NOT NULL
  AND l.post_sales_owner_id IS NULL;

-- 3. ตรวจสอบ leads ที่มี customer_service_id แต่ post_sales_owner_id ไม่ตรงกับ sale_follow_up_assigned_to
SELECT 
  COUNT(*) as leads_mismatched,
  'leads ที่ post_sales_owner_id ไม่ตรงกับ sale_follow_up_assigned_to' as description
FROM public.leads l
INNER JOIN public.customer_services cs ON l.customer_service_id = cs.id
WHERE l.operation_status = 'ติดตามหลังการขาย'
  AND cs.sale_follow_up_assigned_to IS NOT NULL
  AND l.post_sales_owner_id IS NOT NULL
  AND l.post_sales_owner_id != cs.sale_follow_up_assigned_to;

-- 4. ตรวจสอบ customer_services ที่ติดตามแล้วและมี lead แล้ว
--    แต่ lead ไม่มี post_sales_owner_id หรือไม่ตรง
SELECT 
  COUNT(*) as completed_with_lead_but_no_post_sales_owner,
  'customer_services ที่ติดตามแล้ว มี lead แล้ว แต่ lead ไม่มี post_sales_owner_id หรือไม่ตรง' as description
FROM public.customer_services cs
INNER JOIN public.leads l ON l.customer_service_id = cs.id
WHERE cs.service_visit_1 = true
  AND cs.service_visit_2 = true
  AND cs.sale_follow_up_status = 'completed'
  AND cs.sale_follow_up_assigned_to IS NOT NULL
  AND (l.post_sales_owner_id IS NULL OR l.post_sales_owner_id != cs.sale_follow_up_assigned_to);

-- 5. แสดงรายละเอียด customer_services ที่ติดตามแล้วแต่ sale_follow_up_assigned_to = NULL
SELECT 
  cs.id,
  cs.customer_group,
  cs.tel,
  cs.sale_follow_up_status,
  cs.sale_follow_up_assigned_to,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.leads l WHERE l.customer_service_id = cs.id) 
    THEN 'มี lead แล้ว'
    ELSE 'ยังไม่มี lead'
  END as has_lead
FROM public.customer_services cs
WHERE cs.service_visit_1 = true
  AND cs.service_visit_2 = true
  AND cs.sale_follow_up_status = 'completed'
  AND cs.sale_follow_up_assigned_to IS NULL
ORDER BY cs.id
LIMIT 20;

-- 6. สรุปทั้งหมด
SELECT 
  'customer_services ที่ติดตามแล้วทั้งหมด' as category,
  COUNT(*) as count
FROM public.customer_services_extended
WHERE service_visit_1 = true
  AND service_visit_2 = true
  AND sale_follow_up_status = 'completed'

UNION ALL

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
  'customer_services ที่ติดตามแล้ว + มี sale_follow_up_assigned_to + มี lead + lead มี post_sales_owner_id' as category,
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
-- ถ้า customer_services ที่ติดตามแล้วแต่ sale_follow_up_assigned_to = NULL = 15
-- แสดงว่า 15 รายการนี้ไม่มีคนรับผิดชอบ (sale_follow_up_assigned_to = NULL)
-- จึงไม่สามารถสร้าง post_sales_owner_id ได้
-- 
-- ในกรณีนี้ จำนวน "ติดตามแล้ว" = 92 รวมทั้งที่มีและไม่มี sale_follow_up_assigned_to
-- แต่ leads ที่มี post_sales_owner_id = 74 (เฉพาะที่มี sale_follow_up_assigned_to)
-- =============================================================================
