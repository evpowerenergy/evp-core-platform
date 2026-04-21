-- =============================================================================
-- สร้าง leads สำหรับ customer_services ที่ติดตามแล้วแต่ยังไม่มี lead (3 รายการ)
-- ใช้วิธีสร้าง lead โดยตรงแทนการใช้ function
-- =============================================================================

-- 1. แสดง customer_services ที่ต้องสร้าง lead
SELECT 
  cs.id as customer_service_id,
  cs.customer_group,
  cs.tel,
  cs.province,
  cs.notes,
  cs.sale_follow_up_details,
  cs.sale_follow_up_notes,
  cs.capacity_kw,
  cs.sale_follow_up_assigned_to,
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

-- 2. สร้าง leads โดยตรง (ไม่ใช้ function)
INSERT INTO public.leads (
  full_name,
  display_name,
  tel,
  region,
  category,
  platform,
  operation_status,
  status,
  sale_owner_id,
  post_sales_owner_id,
  notes,
  customer_service_id,
  created_at,
  created_at_thai,
  updated_at,
  updated_at_thai
)
SELECT 
  COALESCE(cs.customer_group, 'ไม่ระบุชื่อ') as full_name,
  COALESCE(cs.customer_group, 'ไม่ระบุชื่อ') as display_name,
  cs.tel,
  cs.province as region,
  'Package' as category,
  'ลูกค้าเก่า service ครบ' as platform,
  'ติดตามหลังการขาย' as operation_status,
  'รอรับ' as status,
  NULL as sale_owner_id,  -- sale_owner_id = NULL (ยังไม่มีคนปิดการขาย)
  cs.sale_follow_up_assigned_to as post_sales_owner_id,  -- post_sales_owner_id = Sale ที่ติดตาม
  (
    '🔄 สร้างจากลูกค้าเก่า - ติดตามหลังการขาย (Service ครบแล้ว)' || E'\n' ||
    CASE 
      WHEN cs.capacity_kw IS NOT NULL THEN '⚡ ขนาดติดตั้งเดิม: ' || cs.capacity_kw || ' kW' || E'\n'
      ELSE ''
    END ||
    CASE 
      WHEN cs.notes IS NOT NULL AND cs.notes != '' THEN E'\nหมายเหตุ: ' || cs.notes
      ELSE ''
    END ||
    CASE 
      WHEN cs.sale_follow_up_details IS NOT NULL AND cs.sale_follow_up_details != '' 
      THEN E'\nรายละเอียดติดตาม: ' || cs.sale_follow_up_details
      ELSE ''
    END ||
    CASE 
      WHEN cs.sale_follow_up_notes IS NOT NULL AND cs.sale_follow_up_notes != '' 
      THEN E'\nบันทึกติดตาม: ' || cs.sale_follow_up_notes
      ELSE ''
    END
  ) as notes,
  cs.id as customer_service_id,
  NOW() as created_at,
  NOW() + INTERVAL '7 hours' as created_at_thai,
  NOW() as updated_at,
  NOW() + INTERVAL '7 hours' as updated_at_thai
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
RETURNING id, full_name, tel, post_sales_owner_id, customer_service_id;

-- 3. ตรวจสอบผลลัพธ์
SELECT 
  cs_count.count as customer_services_completed_with_assigned,
  lead_count.count as leads_with_post_sales_owner,
  (cs_count.count - lead_count.count) as difference,
  CASE 
    WHEN (cs_count.count - lead_count.count) = 0 THEN '✅ ตรงกันแล้ว!'
    WHEN (cs_count.count - lead_count.count) <= 2 THEN '⚠️ ต่างกันนิดหน่อย'
    ELSE '❌ ยังต่างกัน'
  END as status
FROM (
  SELECT COUNT(*) as count
  FROM public.customer_services
  WHERE service_visit_1 = true
    AND service_visit_2 = true
    AND sale_follow_up_status = 'completed'
    AND sale_follow_up_assigned_to IS NOT NULL
) cs_count
CROSS JOIN (
  SELECT COUNT(*) as count
  FROM public.leads
  WHERE post_sales_owner_id IS NOT NULL
) lead_count;

-- 4. ตรวจสอบว่ายังมี customer_services ที่ต้องสร้าง lead อีกหรือไม่
SELECT 
  COUNT(*) as remaining_to_create,
  'customer_services ที่ติดตามแล้วแต่ยังไม่มี lead' as description
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

-- 5. แสดง leads ที่เพิ่งสร้าง
SELECT 
  l.id as lead_id,
  l.full_name,
  l.tel,
  l.operation_status,
  l.post_sales_owner_id,
  l.customer_service_id,
  st.name as post_sales_owner_name
FROM public.leads l
LEFT JOIN public.sales_team_with_user_info st ON l.post_sales_owner_id = st.id
WHERE l.customer_service_id IN (
  SELECT cs.id
  FROM public.customer_services cs
  WHERE cs.service_visit_1 = true
    AND cs.service_visit_2 = true
    AND cs.sale_follow_up_status = 'completed'
    AND cs.sale_follow_up_assigned_to IS NOT NULL
)
ORDER BY l.id DESC
LIMIT 10;

-- =============================================================================
-- ✅ เสร็จสิ้น
-- =============================================================================
-- 
-- Query นี้จะ:
-- 1. แสดง customer_services ที่ต้องสร้าง lead (3 รายการ)
-- 2. สร้าง leads โดยตรง (INSERT) สำหรับ 3 รายการนี้
-- 3. ตรวจสอบผลลัพธ์ (ควรได้ difference = 0)
--
-- ข้อดี: สร้าง lead โดยตรง ไม่ต้องใช้ function
-- อาจจะเร็วกว่าและมี error น้อยกว่า
-- =============================================================================
