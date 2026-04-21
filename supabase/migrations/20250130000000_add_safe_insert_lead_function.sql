-- Migration: เพิ่ม function สำหรับ insert lead แบบปลอดภัยจาก race condition
-- Date: 2025-01-30
-- Purpose: แก้ปัญหา duplicate leads เมื่อมีการกรอกข้อมูลพร้อมกัน
-- 
-- วิธีแก้: ใช้ PostgreSQL advisory lock เพื่อ lock เบอร์โทรที่กำลังจะ insert
-- ทำให้การเช็ค duplicate และ insert เป็น atomic operation

-- =============================================================================
-- Function: safe_insert_lead_with_duplicate_check
-- =============================================================================
-- ฟังก์ชันนี้จะ:
-- 1. Normalize เบอร์โทร
-- 2. ใช้ advisory lock เพื่อ lock เบอร์โทรที่กำลังจะ insert
-- 3. เช็ค duplicate (เบอร์ + ชื่อ) ใน transaction
-- 4. Insert ถ้าไม่ซ้ำ หรือ return error ถ้าซ้ำ
-- 5. Release lock อัตโนมัติเมื่อ transaction จบ

CREATE OR REPLACE FUNCTION public.safe_insert_lead_with_duplicate_check(
  p_lead_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tel TEXT;
  v_normalized_tel TEXT;
  v_full_name TEXT;
  v_display_name TEXT;
  v_existing_lead_id INTEGER;
  v_lock_key BIGINT;
  v_inserted_lead_id INTEGER;
  v_result JSONB;
BEGIN
  -- Extract data from JSONB
  v_tel := p_lead_data->>'tel';
  v_full_name := COALESCE(p_lead_data->>'full_name', '');
  v_display_name := COALESCE(p_lead_data->>'display_name', '');
  
  -- Normalize phone number (remove all non-digit characters)
  v_normalized_tel := REGEXP_REPLACE(COALESCE(v_tel, ''), '[^0-9]', '', 'g');
  
  -- ถ้าไม่มีเบอร์โทรหรือเบอร์สั้นเกินไป ให้ insert ได้เลย (ไม่ต้องเช็ค duplicate)
  IF v_normalized_tel = '' OR LENGTH(v_normalized_tel) < 8 THEN
    -- Insert lead without duplicate check
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
      created_by,
      ad_campaign_id,
      email,
      qr_code,
      avg_electricity_bill,
      daytime_percent,
      line_id,
      user_id_platform,
      is_archived,
      is_from_ppa_project,
      assigned_at_thai,
      created_at,
      created_at_thai,
      updated_at,
      updated_at_thai
    )
    SELECT
      COALESCE(p_lead_data->>'full_name', ''),
      COALESCE(p_lead_data->>'display_name', ''),
      v_tel,
      p_lead_data->>'region',
      p_lead_data->>'category',
      p_lead_data->>'platform',
      p_lead_data->>'operation_status',
      p_lead_data->>'status',
      NULLIF(p_lead_data->>'sale_owner_id', '')::INTEGER,
      NULLIF(p_lead_data->>'post_sales_owner_id', '')::INTEGER,
      p_lead_data->>'notes',
      NULLIF(p_lead_data->>'customer_service_id', '')::INTEGER,
      NULLIF(p_lead_data->>'created_by', '')::UUID,
      NULLIF(p_lead_data->>'ad_campaign_id', '')::INTEGER,
      NULLIF(p_lead_data->>'email', ''),
      NULLIF(p_lead_data->>'qr_code', ''),
      NULLIF(p_lead_data->>'avg_electricity_bill', ''),
      NULLIF(p_lead_data->>'daytime_percent', ''),
      NULLIF(p_lead_data->>'line_id', ''),
      NULLIF(p_lead_data->>'user_id_platform', ''),
      COALESCE((p_lead_data->'is_archived')::BOOLEAN, false),
      COALESCE((p_lead_data->'is_from_ppa_project')::BOOLEAN, false),
      NULLIF(p_lead_data->>'assigned_at_thai', '')::TIMESTAMPTZ,
      COALESCE((p_lead_data->>'created_at')::TIMESTAMPTZ, NOW()),
      COALESCE((p_lead_data->>'created_at_thai')::TIMESTAMPTZ, NOW() + INTERVAL '7 hours'),
      COALESCE((p_lead_data->>'updated_at')::TIMESTAMPTZ, NOW()),
      COALESCE((p_lead_data->>'updated_at_thai')::TIMESTAMPTZ, NOW() + INTERVAL '7 hours')
    RETURNING id INTO v_inserted_lead_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'lead_id', v_inserted_lead_id,
      'message', 'Lead created successfully'
    );
  END IF;
  
  -- Generate lock key from normalized phone number
  -- ใช้ hash ของ normalized phone เพื่อสร้าง unique lock key
  -- ใช้ pg_advisory_xact_lock (transaction-level lock) ที่จะ release อัตโนมัติเมื่อ transaction จบ
  v_lock_key := hashtext(v_normalized_tel);
  
  -- Acquire advisory lock (จะรอจนกว่าจะได้ lock)
  -- Lock จะถูก release อัตโนมัติเมื่อ transaction จบ (commit หรือ rollback)
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- หลังจากได้ lock แล้ว เช็ค duplicate อีกครั้ง
  -- (ระหว่างที่รอ lock อาจมี lead อื่นถูก insert แล้ว)
  -- เช็คว่าเบอร์และชื่อเหมือนกันทั้งคู่ (full_name หรือ display_name)
  -- Logic: ถ้าเบอร์ซ้ำและชื่อเหมือนกัน (full_name หรือ display_name) = duplicate
  SELECT id INTO v_existing_lead_id
  FROM public.leads
  WHERE REGEXP_REPLACE(COALESCE(tel, ''), '[^0-9]', '', 'g') = v_normalized_tel
    AND (
      -- เช็ค full_name กับ full_name
      (COALESCE(full_name, '') = v_full_name AND v_full_name != '')
      -- เช็ค display_name กับ display_name
      OR (COALESCE(display_name, '') = v_display_name AND v_display_name != '')
      -- เช็ค full_name กับ display_name (กรณีที่ input เป็น full_name แต่ใน DB เป็น display_name)
      OR (COALESCE(full_name, '') = v_display_name AND v_display_name != '')
      -- เช็ค display_name กับ full_name (กรณีที่ input เป็น display_name แต่ใน DB เป็น full_name)
      OR (COALESCE(display_name, '') = v_full_name AND v_full_name != '')
    )
  LIMIT 1;
  
  -- ถ้าพบ duplicate (เบอร์ + ชื่อเหมือนกัน)
  IF v_existing_lead_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'เบอร์โทรศัพท์และชื่อนี้มีอยู่ในระบบแล้ว',
      'errorCode', 'DUPLICATE_PHONE_AND_NAME',
      'existing_lead_id', v_existing_lead_id
    );
  END IF;
  
  -- ถ้าไม่ซ้ำ → Insert lead
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
    created_by,
    ad_campaign_id,
    email,
    qr_code,
    avg_electricity_bill,
    daytime_percent,
      line_id,
      user_id_platform,
      is_archived,
      is_from_ppa_project,
      assigned_at_thai,
      created_at,
      created_at_thai,
      updated_at,
      updated_at_thai
  )
  SELECT
    COALESCE(p_lead_data->>'full_name', ''),
    COALESCE(p_lead_data->>'display_name', ''),
    v_tel,
    p_lead_data->>'region',
    p_lead_data->>'category',
    p_lead_data->>'platform',
    p_lead_data->>'operation_status',
    p_lead_data->>'status',
    NULLIF(p_lead_data->>'sale_owner_id', '')::INTEGER,
    NULLIF(p_lead_data->>'post_sales_owner_id', '')::INTEGER,
    p_lead_data->>'notes',
      NULLIF(p_lead_data->>'customer_service_id', '')::INTEGER,
      NULLIF(p_lead_data->>'created_by', '')::UUID,
      NULLIF(p_lead_data->>'ad_campaign_id', '')::INTEGER,
    NULLIF(p_lead_data->>'email', ''),
    NULLIF(p_lead_data->>'qr_code', ''),
    NULLIF(p_lead_data->>'avg_electricity_bill', ''),
    NULLIF(p_lead_data->>'daytime_percent', ''),
    NULLIF(p_lead_data->>'line_id', ''),
      NULLIF(p_lead_data->>'user_id_platform', ''),
      COALESCE((p_lead_data->'is_archived')::BOOLEAN, false),
      COALESCE((p_lead_data->'is_from_ppa_project')::BOOLEAN, false),
      NULLIF(p_lead_data->>'assigned_at_thai', '')::TIMESTAMPTZ,
    COALESCE((p_lead_data->>'created_at')::TIMESTAMPTZ, NOW()),
    COALESCE((p_lead_data->>'created_at_thai')::TIMESTAMPTZ, NOW() + INTERVAL '7 hours'),
    COALESCE((p_lead_data->>'updated_at')::TIMESTAMPTZ, NOW()),
    COALESCE((p_lead_data->>'updated_at_thai')::TIMESTAMPTZ, NOW() + INTERVAL '7 hours')
  RETURNING id INTO v_inserted_lead_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'lead_id', v_inserted_lead_id,
    'message', 'Lead created successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to insert lead: ' || SQLERRM,
      'errorCode', 'INSERT_ERROR'
    );
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.safe_insert_lead_with_duplicate_check IS 
'Insert lead with duplicate check using advisory lock to prevent race conditions. 
Uses transaction-level advisory lock to ensure atomic check-and-insert operation.';

-- =============================================================================
-- ✅ เสร็จสิ้น Migration
-- =============================================================================
-- 
-- การเปลี่ยนแปลง:
-- - เพิ่ม function safe_insert_lead_with_duplicate_check()
-- - ใช้ PostgreSQL advisory lock เพื่อป้องกัน race condition
-- - Lock จะถูก release อัตโนมัติเมื่อ transaction จบ
-- - เช็ค duplicate (เบอร์ + ชื่อ) หลังจากได้ lock แล้ว
-- - Insert lead ถ้าไม่ซ้ำ หรือ return error ถ้าซ้ำ
-- =============================================================================
