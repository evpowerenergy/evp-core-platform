-- =============================================================================
-- Query สำหรับ Supabase SQL Editor: เพิ่ม post_sales_owner_id และแก้ไข function
-- =============================================================================
-- 
-- ลำดับการทำงาน:
-- 1. เพิ่ม field post_sales_owner_id ใน table leads
-- 2. อัปเดตข้อมูลจาก sale_follow_up_assigned_to มาใส่ใน post_sales_owner_id
-- 3. แก้ไข function create_lead_from_customer_service() ให้ใช้ post_sales_owner_id
--
-- วิธีการใช้:
-- 1. เปิด Supabase Dashboard → SQL Editor
-- 2. คัดลอก query ทั้งหมดไปรัน
-- 3. ตรวจสอบผลลัพธ์
-- =============================================================================

-- =============================================================================
-- ขั้นตอนที่ 1: เพิ่ม field post_sales_owner_id
-- =============================================================================

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS post_sales_owner_id INTEGER;

-- Foreign key constraint
ALTER TABLE public.leads
DROP CONSTRAINT IF EXISTS fk_leads_post_sales_owner_id;

ALTER TABLE public.leads
ADD CONSTRAINT fk_leads_post_sales_owner_id
FOREIGN KEY (post_sales_owner_id)
REFERENCES sales_team_with_user_info(id)
ON DELETE SET NULL;

-- Index สำหรับ performance (เฉพาะ records ที่มี post_sales_owner_id)
DROP INDEX IF EXISTS idx_leads_post_sales_owner_id;

CREATE INDEX idx_leads_post_sales_owner_id 
ON leads(post_sales_owner_id) 
WHERE post_sales_owner_id IS NOT NULL;

-- Comment สำหรับ documentation
COMMENT ON COLUMN public.leads.post_sales_owner_id IS 
'Sale ที่รับผิดชอบติดตามหลังการขาย (จาก customer_services.sale_follow_up_assigned_to). แยกจาก sale_owner_id (ที่ปิดการขาย)';

-- =============================================================================
-- ขั้นตอนที่ 2: อัปเดตข้อมูลจาก sale_follow_up_assigned_to มาใส่ใน post_sales_owner_id
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

-- =============================================================================
-- ขั้นตอนที่ 3: แก้ไข function create_lead_from_customer_service()
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_lead_from_customer_service(cs_id integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_lead_id INTEGER;
  v_customer_group TEXT;
  v_tel TEXT;
  v_province TEXT;
  v_notes TEXT;
  v_sale_follow_up_details TEXT;
  v_sale_follow_up_notes TEXT;
  v_capacity_kw NUMERIC;
  v_combined_notes TEXT;
  v_normalized_tel TEXT;
  v_existing_lead_id INTEGER;
  v_sale_follow_up_assigned_to INTEGER;  -- เพิ่มตัวแปรนี้
BEGIN
  -- Fetch customer service data รวม sale_follow_up_assigned_to
  SELECT 
    customer_group, 
    tel, 
    province, 
    notes,
    sale_follow_up_details,
    sale_follow_up_notes,
    capacity_kw,
    sale_follow_up_assigned_to  -- เพิ่ม field นี้
  INTO 
    v_customer_group,
    v_tel,
    v_province,
    v_notes,
    v_sale_follow_up_details,
    v_sale_follow_up_notes,
    v_capacity_kw,
    v_sale_follow_up_assigned_to  -- เก็บค่า
  FROM public.customer_services
  WHERE id = cs_id;

  -- Return if no data found
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Build combined notes
  v_combined_notes := '🔄 สร้างจากลูกค้าเก่า - ติดตามหลังการขาย (Service ครบแล้ว)' || E'\n';
  
  -- Add capacity if exists
  IF v_capacity_kw IS NOT NULL THEN
    v_combined_notes := v_combined_notes || '⚡ ขนาดติดตั้งเดิม: ' || v_capacity_kw || ' kW' || E'\n';
  END IF;
  
  -- Add other notes
  IF v_notes IS NOT NULL AND v_notes != '' THEN
    v_combined_notes := v_combined_notes || E'\nหมายเหตุ: ' || v_notes;
  END IF;
  
  IF v_sale_follow_up_details IS NOT NULL AND v_sale_follow_up_details != '' THEN
    v_combined_notes := v_combined_notes || E'\nรายละเอียดติดตาม: ' || v_sale_follow_up_details;
  END IF;
  
  IF v_sale_follow_up_notes IS NOT NULL AND v_sale_follow_up_notes != '' THEN
    v_combined_notes := v_combined_notes || E'\nบันทึกติดตาม: ' || v_sale_follow_up_notes;
  END IF;

  -- Normalize phone number
  v_normalized_tel := REGEXP_REPLACE(COALESCE(v_tel, ''), '[^0-9+]', '', 'g');

  -- Check for existing lead with same phone number
  IF v_normalized_tel != '' THEN
    SELECT id INTO v_existing_lead_id
    FROM public.leads
    WHERE REGEXP_REPLACE(tel, '[^0-9+]', '', 'g') = v_normalized_tel
    LIMIT 1;
  END IF;

  -- If duplicate phone exists, update existing lead
  IF v_existing_lead_id IS NOT NULL THEN
    UPDATE public.leads
    SET 
      notes = COALESCE(notes, '') || E'\n\n🔄 มีการติดตามหลังการขาย (Service ครบแล้ว) - ' || NOW()::DATE || E'\n' || v_combined_notes,
      customer_service_id = cs_id,
      operation_status = 'ติดตามหลังการขาย',
      post_sales_owner_id = v_sale_follow_up_assigned_to,  -- อัปเดต post_sales_owner_id
      -- sale_owner_id ไม่เปลี่ยน (เก็บไว้เป็น Sale A ที่ปิดการขาย)
      updated_at = NOW(),
      updated_at_thai = NOW() + INTERVAL '7 hours'
    WHERE id = v_existing_lead_id;
    
    v_lead_id := v_existing_lead_id;
  ELSE
    -- Create new lead with correct operation_status and post_sales_owner_id
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
      post_sales_owner_id,  -- เพิ่ม field นี้
      notes,
      customer_service_id,
      created_at,
      created_at_thai,
      updated_at,
      updated_at_thai
    ) VALUES (
      COALESCE(v_customer_group, 'ไม่ระบุชื่อ'),
      COALESCE(v_customer_group, 'ไม่ระบุชื่อ'),
      v_tel,
      v_province,
      'Package',
      'ลูกค้าเก่า service ครบ',
      'ติดตามหลังการขาย',
      'รอรับ',
      NULL,  -- sale_owner_id = NULL (ยังไม่มีคนปิดการขาย)
      v_sale_follow_up_assigned_to,  -- post_sales_owner_id = Sale B ที่ติดตาม
      v_combined_notes,
      cs_id,
      NOW(),
      NOW() + INTERVAL '7 hours',
      NOW(),
      NOW() + INTERVAL '7 hours'
    )
    RETURNING id INTO v_lead_id;
  END IF;

  RETURN v_lead_id;
END;
$function$;

-- =============================================================================
-- ✅ เสร็จสิ้น! ตรวจสอบผลลัพธ์
-- =============================================================================

-- ตรวจสอบจำนวน leads ที่มี post_sales_owner_id
SELECT 
  COUNT(*) as total_leads_with_post_sales_owner,
  COUNT(DISTINCT post_sales_owner_id) as unique_sales_assigned
FROM public.leads
WHERE post_sales_owner_id IS NOT NULL;

-- แสดงตัวอย่าง leads ที่ถูกอัปเดต
SELECT 
  l.id,
  l.full_name,
  l.tel,
  l.operation_status,
  l.sale_owner_id,
  l.post_sales_owner_id,
  cs.sale_follow_up_assigned_to,
  st.name as post_sales_owner_name
FROM public.leads l
LEFT JOIN public.customer_services cs ON l.customer_service_id = cs.id
LEFT JOIN public.sales_team_with_user_info st ON l.post_sales_owner_id = st.id
WHERE l.operation_status = 'ติดตามหลังการขาย'
  AND l.post_sales_owner_id IS NOT NULL
LIMIT 10;

-- =============================================================================
-- ✅ เสร็จสิ้นทุกขั้นตอนแล้ว!
-- =============================================================================
-- 
-- ขั้นตอนต่อไป:
-- 1. Generate TypeScript types ใหม่ (ถ้าใช้ Supabase CLI)
-- 2. แก้ไข MyLeads component ให้แสดง leads ที่ post_sales_owner_id ตรงกัน
-- =============================================================================
