-- =============================================================================
-- แก้ไขปัญหา: เปลี่ยน role ของ user ไม่ได้ (ทุกกรณี)
-- =============================================================================
-- 
-- ปัญหา:
-- 1. User ไม่มี record ใน sales_team_with_user_info → พยายาม INSERT แต่ไม่มี id → error
-- 2. User มี record แล้ว → UPDATE ทำงาน แต่บางกรณียัง error
--
-- วิธีแก้: แก้ไข trigger ให้ handle ทุกกรณีและสร้าง id อัตโนมัติ
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_users_change_for_sales_team_v2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  new_id integer;
  existing_record_exists boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Remove from sales_team_with_user_info if user is deleted
    DELETE FROM public.sales_team_with_user_info WHERE user_id = OLD.id;
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- ตรวจสอบว่ามี record อยู่ใน sales_team_with_user_info หรือไม่
    SELECT EXISTS(SELECT 1 FROM public.sales_team_with_user_info WHERE user_id = NEW.id)
    INTO existing_record_exists;
    
    -- Update user info ใน sales_team_with_user_info (ถ้ามี record อยู่แล้ว)
    IF existing_record_exists THEN
      UPDATE public.sales_team_with_user_info 
      SET 
        name = CASE
          WHEN (NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL)
            THEN (NEW.first_name || ' ' || NEW.last_name)
          ELSE 'Unknown User'
        END,
        email = NEW.email,
        phone = NEW.phone,
        department = NEW.department,
        position = NEW.position,
        updated_at = now()
      WHERE user_id = NEW.id;
    END IF;
    
    -- กรณีที่ 1: User เปลี่ยน role เป็น sales role
    IF NEW.role IN ('sale_package', 'sale_wholesale', 'manager_sale') 
       AND (OLD.role IS NULL OR OLD.role NOT IN ('sale_package', 'sale_wholesale', 'manager_sale')) THEN
      
      -- ถ้ายังไม่มี record → สร้างใหม่
      IF NOT existing_record_exists THEN
        -- สร้าง id ใหม่
        SELECT COALESCE(MAX(id), 0) + 1 INTO new_id FROM public.sales_team_with_user_info;
        
        INSERT INTO public.sales_team_with_user_info (
          id, user_id, name, email, phone, department, position, current_leads, status
        ) VALUES (
          new_id,
          NEW.id,
          CASE
            WHEN (NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL)
              THEN (NEW.first_name || ' ' || NEW.last_name)
            ELSE 'Unknown User'
          END,
          NEW.email,
          NEW.phone,
          NEW.department,
          NEW.position,
          0,
          'active'
        );
      ELSE
        -- ถ้ามี record อยู่แล้ว → อัปเดตให้ active
        UPDATE public.sales_team_with_user_info 
        SET 
          status = 'active',
          updated_at = now()
        WHERE user_id = NEW.id;
      END IF;
      
    -- กรณีที่ 2: User เปลี่ยน role จาก sales role เป็น role อื่น
    ELSIF OLD.role IN ('sale_package', 'sale_wholesale', 'manager_sale') 
          AND NEW.role NOT IN ('sale_package', 'sale_wholesale', 'manager_sale') THEN
      
      -- อัปเดต status เป็น inactive (ถ้ามี record)
      IF existing_record_exists THEN
        UPDATE public.sales_team_with_user_info 
        SET status = 'inactive', updated_at = now()
        WHERE user_id = NEW.id;
      END IF;
      
    -- กรณีที่ 3: User เปลี่ยน role อื่นๆ (ไม่ใช่ sales role ทั้งเก่าและใหม่)
    -- ไม่ต้องทำอะไร → ให้ UPDATE ข้อมูล user info เท่านั้น (ถ้ามี record)
    END IF;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'INSERT' THEN
    -- Add to sales_team_with_user_info if new user has sales role
    IF NEW.role IN ('sale_package', 'sale_wholesale', 'manager_sale') THEN
      
      -- สร้าง id ใหม่
      SELECT COALESCE(MAX(id), 0) + 1 INTO new_id FROM public.sales_team_with_user_info;
      
      INSERT INTO public.sales_team_with_user_info (
        id, user_id, name, email, phone, department, position, current_leads, status
      ) VALUES (
        new_id,
        NEW.id,
        CASE
          WHEN (NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL)
            THEN (NEW.first_name || ' ' || NEW.last_name)
          ELSE 'Unknown User'
        END,
        NEW.email,
        NEW.phone,
        NEW.department,
        NEW.position,
        0,
        'active'
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- =============================================================================
-- ✅ เสร็จสิ้น! ตอนนี้แก้ไขทุกกรณีแล้ว:
-- =============================================================================
-- 
-- ✅ User ไม่มี record + เปลี่ยนเป็น sales role → สร้าง record ใหม่พร้อม id
-- ✅ User มี record + เปลี่ยน role → UPDATE ข้อมูลและ status
-- ✅ User เปลี่ยนจาก sales role เป็น role อื่น → UPDATE status = inactive
-- ✅ User เปลี่ยน role อื่นๆ → UPDATE ข้อมูล user info เท่านั้น
-- =============================================================================
