-- =============================================================================
-- แก้ไขปัญหา: null value in column "id" of relation "sales_team_with_user_info"
-- เมื่อเปลี่ยน role ของ user ใน Supabase UI
-- =============================================================================
-- 
-- ปัญหา: เมื่อพยายามเปลี่ยน role ของ user (เช่น เป็น admin_page)
-- ระบบจะเกิด error: "null value in column "id" violates not-null constraint"
--
-- สาเหตุ: trigger handle_users_change_for_sales_team_v2() พยายาม INSERT 
-- ข้อมูลลง sales_team_with_user_info แต่ไม่ได้ระบุค่า id ซึ่งเป็น NOT NULL
--
-- วิธีแก้: รัน migration นี้เพื่อแก้ไข trigger ให้สร้าง id อัตโนมัติ
-- =============================================================================

-- แก้ไข function handle_users_change_for_sales_team_v2()
CREATE OR REPLACE FUNCTION public.handle_users_change_for_sales_team_v2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  new_id integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.sales_team_with_user_info WHERE user_id = OLD.id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update user info in sales_team_with_user_info
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
    
    -- Add to sales_team_with_user_info if user role changed to sales role
    IF NEW.role IN ('sale_package', 'sale_wholesale', 'manager_sale') 
       AND (OLD.role IS NULL OR OLD.role NOT IN ('sale_package', 'sale_wholesale', 'manager_sale')) THEN
      
      -- สร้าง id ใหม่โดยใช้ MAX(id) + 1 หรือ 1 ถ้ายังไม่มีข้อมูล
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
      ) ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        department = EXCLUDED.department,
        position = EXCLUDED.position,
        status = 'active',
        updated_at = now();
    -- Deactivate if user role changed from sales role
    ELSIF OLD.role IN ('sale_package', 'sale_wholesale', 'manager_sale') 
          AND NEW.role NOT IN ('sale_package', 'sale_wholesale', 'manager_sale') THEN
      UPDATE public.sales_team_with_user_info 
      SET status = 'inactive', updated_at = now()
      WHERE user_id = NEW.id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    -- Add to sales_team_with_user_info if new user has sales role
    IF NEW.role IN ('sale_package', 'sale_wholesale', 'manager_sale') THEN
      
      -- สร้าง id ใหม่โดยใช้ MAX(id) + 1 หรือ 1 ถ้ายังไม่มีข้อมูล
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
-- ✅ เสร็จสิ้น! 
-- =============================================================================
-- 
-- ตอนนี้คุณสามารถเปลี่ยน role ของ user ได้แล้วโดยไม่เกิด error
--
-- การทำงาน:
-- - เมื่อเปลี่ยน role เป็น sales role (sale_package, sale_wholesale, manager_sale)
--   → จะสร้าง/อัปเดต record ใน sales_team_with_user_info โดยสร้าง id อัตโนมัติ
-- 
-- - เมื่อเปลี่ยน role จาก sales role เป็น role อื่น (เช่น admin_page)
--   → จะ update status เป็น inactive (ไม่ลบ record)
-- =============================================================================
