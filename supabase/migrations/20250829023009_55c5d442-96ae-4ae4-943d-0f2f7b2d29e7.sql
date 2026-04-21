-- Enable REPLICA IDENTITY FULL for tables that might not have it yet
-- This is safe to run even if already set
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.lead_productivity_logs REPLICA IDENTITY FULL;  
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.quotations REPLICA IDENTITY FULL;
ALTER TABLE public.sales_team_with_user_info REPLICA IDENTITY FULL;