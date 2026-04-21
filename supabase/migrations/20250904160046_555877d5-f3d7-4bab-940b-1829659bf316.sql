-- Remove the old conflicting trigger that's preventing assigned_at_thai from being set
DROP TRIGGER IF EXISTS trigger_update_assigned_at_thai ON public.leads;