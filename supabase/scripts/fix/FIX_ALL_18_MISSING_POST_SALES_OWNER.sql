-- =============================================================================
-- แก้ไขทั้งหมด 18 รายการที่ยังไม่มี post_sales_owner_id sync
-- =============================================================================
-- 
-- ปัญหา:
-- - customer_services ที่ติดตามแล้ว (completed) = 92
-- - leads ที่มี post_sales_owner_id = 74
-- - ต่างกัน 18 รายการ
--
-- วิธีแก้:
-- 1. อัปเดต leads ที่มี customer_service_id แล้วแต่ยังไม่มี post_sales_owner_id
-- 2. สร้าง leads สำหรับ customer_services ที่ติดตามแล้วแต่ยังไม่มี lead
-- =============================================================================

-- =============================================================================
-- ขั้นตอนที่ 1: อัปเดต leads ที่มี customer_service_id แล้ว
-- =============================================================================

-- ตรวจสอบก่อนว่ามีกี่รายการ
SELECT 
  COUNT(*) as leads_to_update,
  'leads ที่มี customer_service_id แต่ยังไม่มี post_sales_owner_id หรือไม่ตรง' as description
FROM public.leads l
INNER JOIN public.customer_services cs ON l.customer_service_id = cs.id
WHERE l.operation_status = 'ติดตามหลังการขาย'
  AND cs.sale_follow_up_assigned_to IS NOT NULL
  AND (l.post_sales_owner_id IS NULL OR l.post_sales_owner_id != cs.sale_follow_up_assigned_to);

-- อัปเดต post_sales_owner_id
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
-- ขั้นตอนที่ 2: สร้าง leads สำหรับ customer_services ที่ติดตามแล้วแต่ยังไม่มี lead
-- =============================================================================

-- ตรวจสอบก่อนว่ามีกี่รายการที่ต้องสร้าง lead
SELECT 
  COUNT(*) as customer_services_without_lead,
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

-- แสดงรายละเอียด customer_services ที่ต้องสร้าง lead
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
ORDER BY cs.id
LIMIT 20;

-- สร้าง leads สำหรับ customer_services ที่ยังไม่มี lead
-- ใช้ function create_lead_from_customer_service() สำหรับแต่ละรายการ
DO $$
DECLARE
  cs_record RECORD;
  created_lead_id INTEGER;
  created_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  -- Loop ผ่าน customer_services ที่ติดตามแล้วแต่ยังไม่มี lead
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
      -- เรียก function create_lead_from_customer_service()
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

-- อัปเดตอีกครั้งเพื่อให้แน่ใจว่าทุก lead ที่มี customer_service_id มี post_sales_owner_id
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

-- 2. เปรียบเทียบกับ customer_services ที่ติดตามแล้ว (ควรต่างกันน้อยมากหรือ 0)
SELECT 
  cs_count.count as customer_services_completed,
  lead_count.count as leads_with_post_sales_owner,
  (cs_count.count - lead_count.count) as difference,
  CASE 
    WHEN (cs_count.count - lead_count.count) = 0 THEN '✅ ตรงกันแล้ว'
    WHEN (cs_count.count - lead_count.count) <= 5 THEN '⚠️ ต่างกันนิดหน่อย (อาจเป็นเพราะ sale_follow_up_assigned_to = NULL)'
    ELSE '❌ ยังต่างกันเยอะ'
  END as status
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

-- 3. ตรวจสอบ customer_services ที่ติดตามแล้วแต่ sale_follow_up_assigned_to = NULL
SELECT 
  COUNT(*) as completed_but_no_assigned_to,
  'customer_services ที่ติดตามแล้วแต่ไม่มี sale_follow_up_assigned_to (นี่คืออีก 15 รายการ)' as description
FROM public.customer_services
WHERE service_visit_1 = true
  AND service_visit_2 = true
  AND sale_follow_up_status = 'completed'
  AND sale_follow_up_assigned_to IS NULL;

-- =============================================================================
-- ✅ เสร็จสิ้น
-- =============================================================================
-- 
-- หลังจากรัน query นี้แล้ว:
-- - leads ที่มี customer_service_id จะถูกอัปเดต post_sales_owner_id แล้ว
-- - customer_services ที่ติดตามแล้วแต่ยังไม่มี lead จะถูกสร้าง lead แล้ว
-- - จำนวน "ติดตามแล้ว" ในหน้าเว็บควรจะตรงกับจำนวน leads ที่มี post_sales_owner_id
--
-- หมายเหตุ: ถ้ายังต่างกัน อาจเป็นเพราะ customer_services บางรายการมี sale_follow_up_assigned_to = NULL
-- =============================================================================
