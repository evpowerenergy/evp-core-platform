-- Enable real-time for all relevant tables
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.lead_productivity_logs REPLICA IDENTITY FULL;  
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.quotations REPLICA IDENTITY FULL;
ALTER TABLE public.sales_team_with_user_info REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_productivity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_team_with_user_info;