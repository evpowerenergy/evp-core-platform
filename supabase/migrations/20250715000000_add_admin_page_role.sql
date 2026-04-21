-- Migration: Add admin_page role
-- Date: 2025-07-15

-- 1. Add admin_page to the enum type
ALTER TYPE "public"."app_role" ADD VALUE 'admin_page';

-- 2. Update functions to include admin_page role

-- Update can_access_crm function to include all roles
CREATE OR REPLACE FUNCTION "public"."can_access_crm"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'sale_package', 'sale_wholesale', 'admin_page', 'manager_hr', 'staff')
  );
$$;

-- Update can_access_hr function to include admin_page
CREATE OR REPLACE FUNCTION "public"."can_access_hr"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_hr', 'staff', 'admin_page')
  );
$$;

-- Update can_manage_crm function to include admin_page
CREATE OR REPLACE FUNCTION "public"."can_manage_crm"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'admin_page')
  );
$$;

-- Update can_manage_hr function to include admin_page
CREATE OR REPLACE FUNCTION "public"."can_manage_hr"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_hr', 'admin_page')
  );
$$;

-- Update can_view_all_leads function to include admin_page
CREATE OR REPLACE FUNCTION "public"."can_view_all_leads"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'admin_page')
  );
$$;

-- Update can_view_all_employees function to include admin_page
CREATE OR REPLACE FUNCTION "public"."can_view_all_employees"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_hr', 'admin_page')
  );
$$;

-- Update can_view_sales_team function to include admin_page
CREATE OR REPLACE FUNCTION "public"."can_view_sales_team"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'admin_page')
  );
$$;

-- Update can_view_reports function to include admin_page
CREATE OR REPLACE FUNCTION "public"."can_view_reports"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'manager_hr', 'admin_page')
  );
$$;

-- Update can_manage_users function to include admin_page
CREATE OR REPLACE FUNCTION "public"."can_manage_users"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_hr', 'admin_page')
  );
$$;

-- Update can_manage_equipment function to include admin_page
CREATE OR REPLACE FUNCTION "public"."can_manage_equipment"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'admin_page')
  );
$$;

-- Update is_admin_or_manager function to include admin_page
CREATE OR REPLACE FUNCTION "public"."is_admin_or_manager"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'manager_hr', 'admin_page')
  );
$$;

-- Update is_manager_or_admin function to include admin_page
CREATE OR REPLACE FUNCTION "public"."is_manager_or_admin"("user_id" "uuid") 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role IN ('super_admin', 'manager_sale', 'manager_hr', 'admin_page')
  );
$$;

-- Update is_sales_role function to include admin_page
CREATE OR REPLACE FUNCTION "public"."is_sales_role"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'sale_package', 'sale_wholesale', 'admin_page')
  );
$$;

-- Create new function to check if user can access package (admin_page should NOT have access)
CREATE OR REPLACE FUNCTION "public"."can_access_package"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'sale_package')
  );
$$;

-- Create new function to check if user can access wholesale (admin_page should NOT have access)
CREATE OR REPLACE FUNCTION "public"."can_access_wholesale"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role IN ('super_admin', 'manager_sale', 'sale_wholesale')
  );
$$;

-- Create new function to check if user is admin_page
CREATE OR REPLACE FUNCTION "public"."is_admin_page"() 
RETURNS boolean
LANGUAGE "sql" STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() AND role = 'admin_page'
  );
$$; 