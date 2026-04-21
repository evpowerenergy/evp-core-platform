
-- ขั้นตอนที่ 1: ลบ triggers ที่เกี่ยวข้องกับ sales_team
DROP TRIGGER IF EXISTS sales_team_change_trigger ON sales_team;

-- ขั้นตอนที่ 2: อัปเดต functions ให้ใช้ sales_team_with_user_info แทน sales_team
CREATE OR REPLACE FUNCTION public.sync_sales_team_with_user_info()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Clear existing data
  DELETE FROM public.sales_team_with_user_info;
  
  -- Insert synced data from users table directly (since sales_team will be removed)
  INSERT INTO public.sales_team_with_user_info (
    id, user_id, name, email, phone, department, position, current_leads, status
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY u.id) AS id, -- Generate sequential IDs
    u.id AS user_id,
    CASE
      WHEN (u.first_name IS NOT NULL AND u.last_name IS NOT NULL)
        THEN (u.first_name || ' ' || u.last_name)
      ELSE 'Unknown User'
    END AS name,
    u.email,
    u.phone,
    u.department,
    u.position,
    0 AS current_leads, -- Default to 0, will be updated by lead count functions
    'active' AS status
  FROM public.users u
  WHERE u.role IN ('sale_package', 'sale_wholesale', 'manager_sale');
END;
$function$;

-- ขั้นตอนที่ 3: สร้าง function ใหม่สำหรับอัปเดต current_leads โดยตรงใน sales_team_with_user_info
CREATE OR REPLACE FUNCTION public.update_sales_team_current_leads_v2(sales_member_id integer)
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
  lead_count integer;
BEGIN
  -- Count current active leads for this sales member
  SELECT COUNT(*) INTO lead_count
  FROM leads
  WHERE sale_owner_id = sales_member_id
  AND status = 'กำลังติดตาม'
  AND is_archived = false;

  -- Update the sales team member's current_leads
  UPDATE sales_team_with_user_info
  SET current_leads = lead_count,
      updated_at = now()
  WHERE id = sales_member_id;

  RETURN COALESCE(lead_count, 0);
END;
$function$;

-- ขั้นตอนที่ 4: สร้าง function สำหรับอัปเดต current_leads ของสมาชิกทั้งหมด
CREATE OR REPLACE FUNCTION public.update_all_sales_team_current_leads_v2()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  sales_member RECORD;
BEGIN
  -- Update each member's current leads
  FOR sales_member IN 
    SELECT id FROM sales_team_with_user_info WHERE status = 'active'
  LOOP
    PERFORM update_sales_team_current_leads_v2(sales_member.id);
  END LOOP;
END;
$function$;

-- ขั้นตอนที่ 5: รัน sync function เพื่อเติมข้อมูล
SELECT sync_sales_team_with_user_info();

-- ขั้นตอนที่ 6: อัปเดต current_leads สำหรับทุกคน
SELECT update_all_sales_team_current_leads_v2();

-- ขั้นตอนที่ 7: สร้าง trigger ใหม่สำหรับ users table เพื่อ sync กับ sales_team_with_user_info
CREATE OR REPLACE FUNCTION public.handle_users_change_for_sales_team_v2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Remove from sales_team_with_user_info if user is deleted
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
      INSERT INTO public.sales_team_with_user_info (
        user_id, name, email, phone, department, position, current_leads, status
      ) VALUES (
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
      INSERT INTO public.sales_team_with_user_info (
        user_id, name, email, phone, department, position, current_leads, status
      ) VALUES (
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

-- สร้าง trigger ใหม่
DROP TRIGGER IF EXISTS users_change_for_sales_team_trigger ON users;
CREATE TRIGGER users_change_for_sales_team_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION handle_users_change_for_sales_team_v2();

-- เพิ่ม unique constraint สำหรับ user_id ในกรณีที่ยังไม่มี
ALTER TABLE sales_team_with_user_info 
ADD CONSTRAINT unique_sales_team_user_id UNIQUE (user_id);

-- ขั้นตอนสุดท้าย: ลบตาราง sales_team
DROP TABLE IF EXISTS sales_team CASCADE;
