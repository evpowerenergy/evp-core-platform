-- =============================================================================
-- แก้ไขทั้งหมด 18 รายการ: อัปเดต post_sales_owner_id และสร้าง lead ที่ขาด
-- =============================================================================
-- 
-- สถานการณ์:
-- - customer_services ที่ติดตามแล้ว (completed) = 92
-- - leads ที่มี post_sales_owner_id = 74
-- - ต่างกัน = 18 รายการ
--
-- แบ่งเป็น:
-- 1. 3 รายการ: customer_services ที่ติดตามแล้วแต่ยังไม่มี lead
-- 2. 15 รายการ: customer_services ที่ติดตามแล้ว มี lead แล้ว 
--               แต่ lead ไม่มี post_sales_owner_id หรือไม่ตรง
-- =============================================================================

-- =============================================================================
-- ขั้นตอนที่ 1: อัปเดต post_sales_owner_id สำหรับ leads ที่มี customer_service_id แล้ว
--               แต่ยังไม่มี post_sales_owner_id หรือไม่ตรง (15 รายการ)
-- =============================================================================

-- ตรวจสอบก่อน (ใช้เงื่อนไขเดียวกับที่ได้ 15 รายการ)
SELECT 
  COUNT(*) as leads_to_fix,
  'customer_services ที่ติดตามแล้ว มี lead แล้ว แต่ lead ไม่มี post_sales_owner_id หรือไม่ตรง' as description
FROM public.customer_services cs
INNER JOIN public.leads l ON l.customer_service_id = cs.id
WHERE cs.service_visit_1 = true
  AND cs.service_visit_2 = true
  AND cs.sale_follow_up_status = 'completed'
  AND cs.sale_follow_up_assigned_to IS NOT NULL
  AND (l.post_sales_owner_id IS NULL OR l.post_sales_owner_id != cs.sale_follow_up_assigned_to);

-- อัปเดต post_sales_owner_id (ใช้เงื่อนไขเดียวกับที่ได้ 15 รายการ)
UPDATE public.leads l
SET 
  post_sales_owner_id = cs.sale_follow_up_assigned_to,
  updated_at = NOW(),
  updated_at_thai = NOW() + INTERVAL '7 hours'
FROM public.customer_services cs
WHERE l.customer_service_id = cs.id
  AND cs.service_visit_1 = true
  AND cs.service_visit_2 = true
  AND cs.sale_follow_up_status = 'completed'
  AND cs.sale_follow_up_assigned_to IS NOT NULL
  AND (l.post_sales_owner_id IS NULL OR l.post_sales_owner_id != cs.sale_follow_up_assigned_to);

-- =============================================================================
-- ขั้นตอนที่ 2: สร้าง leads สำหรับ customer_services ที่ติดตามแล้วแต่ยังไม่มี lead (3 รายการ)
-- =============================================================================

-- ตรวจสอบก่อน
SELECT 
  COUNT(*) as customer_services_without_lead,
  'customer_services ที่ต้องสร้าง lead' as description
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

-- สร้าง leads
DO $$
DECLARE
  cs_record RECORD;
  created_lead_id INTEGER;
  created_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  FOR cs_record IN 
    SELECT cs.id
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
  LOOP
    BEGIN
      SELECT public.create_lead_from_customer_service(cs_record.id) INTO created_lead_id;
      
      IF created_lead_id IS NOT NULL THEN
        created_count := created_count + 1;
        RAISE NOTICE '✅ Created lead % for customer_service %', created_lead_id, cs_record.id;
      ELSE
        RAISE NOTICE '⚠️ Failed to create lead for customer_service %', cs_record.id;
        error_count := error_count + 1;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ Error creating lead for customer_service %: %', cs_record.id, SQLERRM;
        error_count := error_count + 1;
    END;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  Total leads created: %', created_count;
  RAISE NOTICE '  Errors: %', error_count;
  RAISE NOTICE '========================================';
END $$;

-- =============================================================================
-- ขั้นตอนที่ 3: อัปเดต post_sales_owner_id สำหรับ leads ที่เพิ่งสร้าง (ถ้ายังไม่มี)
-- =============================================================================

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

-- =============================================================================
-- ตรวจสอบผลลัพธ์หลังแก้ไข
-- =============================================================================

-- 1. นับ leads ที่มี post_sales_owner_id (ควรได้ 92 หรือใกล้เคียง)
SELECT 
  COUNT(*) as total_leads_with_post_sales_owner,
  COUNT(DISTINCT post_sales_owner_id) as unique_sales_assigned,
  'หลังแก้ไข' as status
FROM public.leads
WHERE post_sales_owner_id IS NOT NULL;

-- 2. เปรียบเทียบกับ customer_services ที่ติดตามแล้วและมี sale_follow_up_assigned_to
SELECT 
  cs_count.count as customer_services_completed_with_assigned,
  lead_count.count as leads_with_post_sales_owner,
  (cs_count.count - lead_count.count) as difference,
  CASE 
    WHEN (cs_count.count - lead_count.count) = 0 THEN '✅ ตรงกันแล้ว!'
    WHEN (cs_count.count - lead_count.count) <= 2 THEN '⚠️ ต่างกันนิดหน่อย (อาจเป็นเพราะ processing)'
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

-- 3. ตรวจสอบว่ายังมี customer_services ที่ต้องแก้ไขอีกหรือไม่
SELECT 
  COUNT(*) as remaining_issues,
  'customer_services ที่ติดตามแล้ว มี lead แล้ว แต่ lead ไม่มี post_sales_owner_id หรือไม่ตรง' as description
FROM public.customer_services cs
INNER JOIN public.leads l ON l.customer_service_id = cs.id
WHERE cs.service_visit_1 = true
  AND cs.service_visit_2 = true
  AND cs.sale_follow_up_status = 'completed'
  AND cs.sale_follow_up_assigned_to IS NOT NULL
  AND (l.post_sales_owner_id IS NULL OR l.post_sales_owner_id != cs.sale_follow_up_assigned_to);

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

-- =============================================================================
-- ✅ เสร็จสิ้น
-- =============================================================================
-- 
-- หลังจากรัน query นี้แล้ว:
-- - อัปเดต post_sales_owner_id สำหรับ leads ที่มี customer_service_id แล้ว (15 รายการ)
-- - สร้าง leads สำหรับ customer_services ที่ยังไม่มี lead (3 รายการ)
-- - จำนวน "ติดตามแล้ว" ในหน้าเว็บควรจะตรงกับจำนวน leads ที่มี post_sales_owner_id
--
-- หมายเหตุ: จำนวน customer_services ที่ติดตามแล้ว = 92
--          แต่ leads ที่มี post_sales_owner_id = จำนวน customer_services ที่มี sale_follow_up_assigned_to
--          (ไม่รวม customer_services ที่ sale_follow_up_assigned_to = NULL)
-- =============================================================================
