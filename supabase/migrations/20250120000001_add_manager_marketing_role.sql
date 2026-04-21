-- Migration: Add manager_marketing role
-- Date: 2025-01-20
-- Description: Add manager_marketing role with same permissions as manager_sale

-- 1. Add manager_marketing role to the enum type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'manager_marketing' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    ) THEN
        ALTER TYPE "public"."app_role" ADD VALUE 'manager_marketing';
    END IF;
END $$;

-- 2. Update database functions to include manager_marketing (same permissions as manager_sale)

-- Update can_access_crm function to include manager_marketing
CREATE OR REPLACE FUNCTION "public"."can_access_crm"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'manager_marketing', 'sale_package', 'sale_wholesale', 'admin_page', 'manager_hr', 'staff')
  );
$$;

-- Update can_manage_crm function to include manager_marketing
CREATE OR REPLACE FUNCTION "public"."can_manage_crm"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'manager_marketing', 'admin_page')
  );
$$;

-- Update can_view_all_leads function to include manager_marketing
CREATE OR REPLACE FUNCTION "public"."can_view_all_leads"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'manager_marketing', 'admin_page')
  );
$$;

-- Update can_view_sales_team function to include manager_marketing
CREATE OR REPLACE FUNCTION "public"."can_view_sales_team"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'manager_marketing', 'admin_page')
  );
$$;

-- Update can_view_reports function to include manager_marketing
CREATE OR REPLACE FUNCTION "public"."can_view_reports"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'manager_marketing', 'manager_hr', 'admin_page')
  );
$$;

-- Update can_access_package function to include manager_marketing
CREATE OR REPLACE FUNCTION "public"."can_access_package"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'manager_marketing', 'sale_package')
  );
$$;

-- Update can_access_wholesale function to include manager_marketing
CREATE OR REPLACE FUNCTION "public"."can_access_wholesale"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'manager_marketing', 'sale_wholesale')
  );
$$;

-- Update is_manager_or_admin function to include manager_marketing
CREATE OR REPLACE FUNCTION "public"."is_manager_or_admin"("user_id" "uuid") 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role IN ('super_admin', 'manager_sale', 'manager_marketing', 'manager_hr', 'admin_page')
  );
$$;

-- Update is_admin_or_manager function to include manager_marketing
CREATE OR REPLACE FUNCTION "public"."is_admin_or_manager"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'manager_marketing', 'manager_hr')
  );
$$;

-- Update is_sales_role function to include manager_marketing
CREATE OR REPLACE FUNCTION "public"."is_sales_role"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'manager_marketing', 'sale_package', 'sale_wholesale', 'admin_page')
  );
$$;

