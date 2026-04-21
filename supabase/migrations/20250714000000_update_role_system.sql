-- Migration: Update Role System to support 6 new roles
-- Date: 2025-07-14

-- 1. Drop existing enum type
DROP TYPE IF EXISTS "public"."app_role" CASCADE;

-- 2. Create new enum type with 6 roles
CREATE TYPE "public"."app_role" AS ENUM (
    'super_admin',
    'manager_sale',
    'manager_hr',
    'sale_package',
    'sale_wholesale',
    'staff'
);

-- 3. Update users table role column
ALTER TABLE "public"."users" 
ALTER COLUMN "role" TYPE "public"."app_role" 
USING (
    CASE 
        WHEN role = 'admin' THEN 'super_admin'::"public"."app_role"
        WHEN role = 'manager' THEN 'manager_sale'::"public"."app_role"
        WHEN role = 'sale' THEN 'sale_package'::"public"."app_role"
        ELSE 'staff'::"public"."app_role"
    END
);

-- 4. Set default value for role column
ALTER TABLE "public"."users" 
ALTER COLUMN "role" SET DEFAULT 'staff'::"public"."app_role";

-- 5. Update existing functions to work with new role system

-- Update get_current_user_role function
CREATE OR REPLACE FUNCTION "public"."get_current_user_role"() 
RETURNS "text"
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT role::text FROM public.users WHERE auth_user_id = auth.uid();
$$;

-- Update is_admin function
CREATE OR REPLACE FUNCTION "public"."is_admin"("user_id" "uuid") 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'super_admin'
  );
$$;

-- Update is_admin_or_manager function
CREATE OR REPLACE FUNCTION "public"."is_admin_or_manager"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'manager_hr')
  );
$$;

-- Update is_manager_or_admin function
CREATE OR REPLACE FUNCTION "public"."is_manager_or_admin"("user_id" "uuid") 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role IN ('super_admin', 'manager_sale', 'manager_hr')
  );
$$;

-- Update is_sale_user function
CREATE OR REPLACE FUNCTION "public"."is_sale_user"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('sale_package', 'sale_wholesale')
  );
$$;

-- Update is_sales_role function
CREATE OR REPLACE FUNCTION "public"."is_sales_role"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'sale_package', 'sale_wholesale')
  );
$$;

-- Create new functions for role checking

-- Check if user can access CRM
CREATE OR REPLACE FUNCTION "public"."can_access_crm"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'sale_package', 'sale_wholesale')
  );
$$;

-- Check if user can access HR
CREATE OR REPLACE FUNCTION "public"."can_access_hr"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_hr', 'staff')
  );
$$;

-- Check if user can manage CRM
CREATE OR REPLACE FUNCTION "public"."can_manage_crm"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale')
  );
$$;

-- Check if user can manage HR
CREATE OR REPLACE FUNCTION "public"."can_manage_hr"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_hr')
  );
$$;

-- Check if user can access package sales
CREATE OR REPLACE FUNCTION "public"."can_access_package"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'sale_package')
  );
$$;

-- Check if user can access wholesale sales
CREATE OR REPLACE FUNCTION "public"."can_access_wholesale"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'sale_wholesale')
  );
$$;

-- Update sync_sales_team function to work with new roles
CREATE OR REPLACE FUNCTION "public"."sync_sales_team"() 
RETURNS "trigger"
LANGUAGE "plpgsql"
AS $$
BEGIN
  -- ถ้า user มี role = 'sale_package' หรือ 'sale_wholesale' ให้เพิ่มเข้า sales_team
  IF NEW.role IN ('sale_package', 'sale_wholesale') AND 
     (OLD.role IS NULL OR OLD.role NOT IN ('sale_package', 'sale_wholesale')) THEN
    INSERT INTO public.sales_team (user_id, status, current_leads)
    VALUES (NEW.id, 'active', 0)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  -- ถ้า user เปลี่ยนจาก sale role เป็น role อื่น ให้ปิดการใช้งาน
  IF OLD.role IN ('sale_package', 'sale_wholesale') AND 
     NEW.role NOT IN ('sale_package', 'sale_wholesale') THEN
    UPDATE public.sales_team 
    SET status = 'inactive'
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update sales_team_with_user_info view
DROP VIEW IF EXISTS "public"."sales_team_with_user_info";

CREATE VIEW "public"."sales_team_with_user_info" AS
SELECT
  st.id,
  st.user_id,
  CASE
    WHEN (u.first_name IS NOT NULL AND u.last_name IS NOT NULL)
      THEN (u.first_name || ' ' || u.last_name)
    ELSE 'Unknown User'
  END AS name,
  u.email,
  u.phone,
  u.department,
  u.position,
  u.role,
  st.current_leads,
  st.status
FROM public.sales_team st
LEFT JOIN public.users u ON st.user_id = u.id
WHERE u.role IN ('sale_package', 'sale_wholesale') OR u.role IS NULL;

-- Update RLS policies to work with new roles

-- Update leads policies
DROP POLICY IF EXISTS "authenticated_users_can_view_all_leads" ON "public"."leads";
CREATE POLICY "authenticated_users_can_view_all_leads" 
ON "public"."leads" 
FOR SELECT 
TO authenticated 
USING (
  public.can_access_crm() AND (
    public.can_manage_crm() OR 
    sale_owner_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  )
);

-- Update users policies
DROP POLICY IF EXISTS "authenticated_users_can_view_all_users" ON "public"."users";
CREATE POLICY "authenticated_users_can_view_all_users" 
ON "public"."users" 
FOR SELECT 
TO authenticated 
USING (
  public.can_access_hr() AND (
    public.can_manage_hr() OR 
    id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  )
);

-- Grant permissions to new functions
GRANT EXECUTE ON FUNCTION "public"."can_access_crm"() TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."can_access_hr"() TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."can_manage_crm"() TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."can_manage_hr"() TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."can_access_package"() TO authenticated;
GRANT EXECUTE ON FUNCTION "public"."can_access_wholesale"() TO authenticated;

-- Create index for role column
CREATE INDEX IF NOT EXISTS idx_users_role_new ON users(role);

-- Update existing data (optional - set some users to appropriate roles)
-- UPDATE public.users SET role = 'super_admin' WHERE email = 'admin@company.com';
-- UPDATE public.users SET role = 'manager_sale' WHERE department = 'sale' AND position LIKE '%manager%';
-- UPDATE public.users SET role = 'manager_hr' WHERE department = 'office' AND position LIKE '%hr%';

COMMENT ON TYPE "public"."app_role" IS 'Role system for CRM and HR applications';
COMMENT ON COLUMN "public"."users"."role" IS 'User role in the system'; 