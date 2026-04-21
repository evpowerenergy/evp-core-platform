-- =============================================================================
-- Migration: แก้ไข function create_lead_from_customer_service() ให้อนุญาตเบอร์ซ้ำแต่ชื่อต่างกัน
-- =============================================================================
-- 
-- วัตถุประสงค์:
-- - แก้ไข logic การตรวจสอบเบอร์ซ้ำให้ตรวจสอบทั้งเบอร์และชื่อ
-- - ถ้าเบอร์ซ้ำแต่ชื่อต่างกัน ให้สร้างลีดใหม่ได้
-- - ถ้าเบอร์และชื่อเหมือนกันทั้งคู่ ให้ UPDATE lead เดิม
--
-- Use case:
-- - เบอร์ 063-8784242 มีลีดอยู่แล้ว (ชื่อ: ชื่ออื่น)
-- - พยายามสร้างลีดใหม่สำหรับ "คุณ จันทรา (คุณส้ม)" (เบอร์เดียวกัน)
-- - ควรจะสร้างลีดใหม่ได้เพราะชื่อต่างกัน
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
  v_existing_lead_name TEXT;
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

  -- Check for existing lead with same phone number AND same name
  -- ถ้าเบอร์ซ้ำแต่ชื่อต่างกัน ให้สร้างลีดใหม่ได้
  IF v_normalized_tel != '' THEN
    SELECT id, full_name INTO v_existing_lead_id, v_existing_lead_name
    FROM public.leads
    WHERE REGEXP_REPLACE(tel, '[^0-9+]', '', 'g') = v_normalized_tel
      AND full_name = COALESCE(v_customer_group, 'ไม่ระบุชื่อ')
    LIMIT 1;
  END IF;

  -- If duplicate phone AND name exists, update existing lead
  -- ถ้าเบอร์และชื่อเหมือนกันทั้งคู่ ให้ UPDATE lead เดิม
  IF v_existing_lead_id IS NOT NULL THEN
    UPDATE public.leads
    SET 
      notes = COALESCE(notes, '') || E'\n\n🔄 มีการติดตามหลังการขาย (Service ครบแล้ว) - ' || NOW()::DATE || E'\n' || v_combined_notes,
      customer_service_id = cs_id,
      operation_status = 'ติดตามหลังการขาย',
      post_sales_owner_id = v_sale_follow_up_assigned_to,
      -- sale_owner_id ไม่เปลี่ยน (เก็บไว้เป็น Sale A ที่ปิดการขาย)
      updated_at = NOW(),
      updated_at_thai = NOW() + INTERVAL '7 hours'
    WHERE id = v_existing_lead_id;
    
    v_lead_id := v_existing_lead_id;
  ELSE
    -- Create new lead (เบอร์ซ้ำแต่ชื่อต่างกัน หรือไม่มีลีดเดิมเลย)
    -- ถ้าเบอร์ซ้ำแต่ชื่อต่างกัน ให้สร้างลีดใหม่ได้
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
-- ✅ เสร็จสิ้น Migration: แก้ไข function แล้ว
-- =============================================================================
-- 
-- การเปลี่ยนแปลง:
-- - เปลี่ยนการตรวจสอบจาก "เบอร์ซ้ำ" เป็น "เบอร์และชื่อซ้ำ"
-- - ถ้าเบอร์ซ้ำแต่ชื่อต่างกัน ให้สร้างลีดใหม่ได้
-- - ถ้าเบอร์และชื่อเหมือนกันทั้งคู่ ให้ UPDATE lead เดิม
-- =============================================================================













