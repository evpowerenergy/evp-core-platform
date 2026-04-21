
-- Enable RLS on the sales_team table if not already enabled
ALTER TABLE public.sales_team ENABLE ROW LEVEL SECURITY;

-- Create policy for sales_team table to allow authenticated users to view all records
CREATE POLICY "Authenticated users can view sales team" 
ON public.sales_team 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policy for sales_team table to allow authenticated users to update records
CREATE POLICY "Authenticated users can update sales team" 
ON public.sales_team 
FOR UPDATE 
TO authenticated 
USING (true);

-- Create policy for sales_team table to allow authenticated users to insert records
CREATE POLICY "Authenticated users can insert sales team" 
ON public.sales_team 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Enable RLS on the users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users table to allow authenticated users to view all records
CREATE POLICY "Authenticated users can view users" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (true);

-- Grant necessary permissions on the view to authenticated users
GRANT SELECT ON public.sales_team_with_user_info TO authenticated;
GRANT INSERT ON public.sales_team_with_user_info TO authenticated;
GRANT UPDATE ON public.sales_team_with_user_info TO authenticated;
GRANT DELETE ON public.sales_team_with_user_info TO authenticated;

-- Create a security definer function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;
