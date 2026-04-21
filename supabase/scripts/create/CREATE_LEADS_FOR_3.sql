-- =============================================================================
-- สร้าง leads สำหรับ customer_services ที่ติดตามแล้วแต่ยังไม่มี lead (3 รายการ)
-- =============================================================================
-- 
-- สถานการณ์:
-- - customer_services ที่ติดตามแล้ว + มี sale_follow_up_assigned_to = 92
-- - leads ที่มี post_sales_owner_id = 89
-- - ต่างกัน = 3 รายการ
-- - สาเหตุ: customer_services ที่ติดตามแล้วแต่ยังไม่มี lead = 3 รายการ
-- =============================================================================

-- 1. แสดง customer_services ที่ต้องสร้าง lead
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

-- 2. สร้าง leads สำหรับ 3 รายการนี้
DO $$
DECLARE
  cs_record RECORD;
  created_lead_id INTEGER;
  created_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Starting to create leads for 3 customer_services...';
  RAISE NOTICE '========================================';
  
  FOR cs_record IN 
    SELECT cs.id, cs.customer_group, cs.tel
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
      RAISE NOTICE 'Processing customer_service % (Customer: %, Tel: %)', cs_record.id, cs_record.customer_group, cs_record.tel;
      
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

-- 3. อัปเดต post_sales_owner_id สำหรับ leads ที่เพิ่งสร้าง (เพื่อให้แน่ใจว่ามี post_sales_owner_id)
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

-- 4. ตรวจสอบผลลัพธ์หลังสร้าง leads
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

-- 5. ตรวจสอบว่ายังมี customer_services ที่ต้องสร้าง lead อีกหรือไม่
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
-- Query นี้จะ:
-- 1. แสดง customer_services ที่ต้องสร้าง lead (3 รายการ)
-- 2. สร้าง leads สำหรับ 3 รายการนี้
-- 3. อัปเดต post_sales_owner_id สำหรับ leads ที่เพิ่งสร้าง
-- 4. ตรวจสอบผลลัพธ์ (ควรได้ difference = 0)
--
-- หลังจากรัน query นี้แล้ว จำนวน "ติดตามแล้ว" ควรจะตรงกับจำนวน leads 
-- ที่มี post_sales_owner_id (92 = 92)
-- =============================================================================
