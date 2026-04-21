-- Migration: Remove max_leads from sales_team and update dependent view

-- 1. Drop the old view that depends on max_leads
DROP VIEW IF EXISTS public.sales_team_with_user_info;

-- 2. Drop the max_leads column from sales_team
ALTER TABLE public.sales_team DROP COLUMN IF EXISTS max_leads;

-- 3. Recreate the view without max_leads
CREATE VIEW public.sales_team_with_user_info AS
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
  st.current_leads,
  st.status
FROM public.sales_team st
LEFT JOIN public.users u ON st.user_id = u.id
WHERE u.role = 'sale' OR u.role IS NULL;

-- 4. Grant SELECT, INSERT, UPDATE, DELETE on the view to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_team_with_user_info TO authenticated;
