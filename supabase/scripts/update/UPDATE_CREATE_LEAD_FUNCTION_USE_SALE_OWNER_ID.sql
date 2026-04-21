-- =============================================================================
-- ปรับปรุง function create_lead_from_customer_service()
-- สำหรับกรณี INSERT (Lead ใหม่): ใช้ sale_owner_id แทน post_sales_owner_id
-- =============================================================================
-- 
-- การเปลี่ยนแปลง:
-- - กรณี UPDATE lead เดิม: ยังคงใช้ post_sales_owner_id (เก็บ sale_owner_id เดิมไว้)
-- - กรณี INSERT lead ใหม่: ใช้ sale_owner_id = sale_follow_up_assigned_to (ไม่ใช้ post_sales_owner_id)
--
-- เหตุผล:
-- - Lead ใหม่ไม่มี sale_owner_id เดิมอยู่แล้ว
-- - ใช้ sale_owner_id = sale_follow_up_assigned_to จะทำให้ Sale เห็น lead ใน "ลีดของฉัน" ทันที
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
  v_sale_follow_up_assigned_to INTEGER;
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
    sale_follow_up_assigned_to
  INTO 
    v_customer_group,
    v_tel,
    v_province,
    v_notes,
    v_sale_follow_up_details,
    v_sale_follow_up_notes,
    v_capacity_kw,
    v_sale_follow_up_assigned_to
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

  -- กรณีที่ 1: ถ้ามี Lead เดิม → UPDATE (ใช้ post_sales_owner_id)
  IF v_existing_lead_id IS NOT NULL THEN
    UPDATE public.leads
    SET 
      notes = COALESCE(notes, '') || E'\n\n🔄 มีการติดตามหลังการขาย (Service ครบแล้ว) - ' || NOW()::DATE || E'\n' || v_combined_notes,
      customer_service_id = cs_id,
      operation_status = 'ติดตามหลังการขาย',
      post_sales_owner_id = v_sale_follow_up_assigned_to,  -- ← ใช้ post_sales_owner_id (เก็บ sale_owner_id เดิมไว้)
      -- sale_owner_id ไม่เปลี่ยน (เก็บไว้เป็น Sale A ที่ปิดการขาย)
      updated_at = NOW(),
      updated_at_thai = NOW() + INTERVAL '7 hours'
    WHERE id = v_existing_lead_id;
    
    v_lead_id := v_existing_lead_id;
  ELSE
    -- กรณีที่ 2: ถ้าไม่มี Lead เดิม → INSERT (ใช้ sale_owner_id)
    INSERT INTO public.leads (
      full_name,
      display_name,
      tel,
      region,
      category,
      platform,
      operation_status,
      status,
      sale_owner_id,  -- ← ใช้ sale_owner_id สำหรับ lead ใหม่
      post_sales_owner_id,  -- ← ยังใส่ไว้เพื่อความสอดคล้อง (อาจจะ NULL หรือ = sale_owner_id)
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
      v_sale_follow_up_assigned_to,  -- ← sale_owner_id = Sale ที่ติดตาม (ใหม่!)
      v_sale_follow_up_assigned_to,  -- ← post_sales_owner_id = Sale ที่ติดตาม (เหมือนกัน)
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
-- ✅ เสร็จสิ้น
-- =============================================================================
-- 
-- ตอนนี้ function ทำงานดังนี้:
--
-- **กรณีที่ 1: UPDATE Lead เดิม**
-- - อัปเดต post_sales_owner_id = sale_follow_up_assigned_to
-- - เก็บ sale_owner_id เดิมไว้ (ไม่เปลี่ยน)
--
-- **กรณีที่ 2: INSERT Lead ใหม่**
-- - sale_owner_id = sale_follow_up_assigned_to (ใหม่!)
-- - post_sales_owner_id = sale_follow_up_assigned_to (เหมือนกัน)
-- - Sale จะเห็น lead ใน "ลีดของฉัน" ทันที
-- =============================================================================
