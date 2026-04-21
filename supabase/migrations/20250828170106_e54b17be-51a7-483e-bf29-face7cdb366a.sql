-- Create trigger function to update leads.updated_at when productivity log is added
CREATE OR REPLACE FUNCTION public.update_lead_on_productivity_log()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update the associated lead's updated_at and updated_at_thai
  UPDATE public.leads 
  SET 
    updated_at = now(),
    updated_at_thai = now() + INTERVAL '7 hours'
  WHERE id = NEW.lead_id;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on lead_productivity_logs
CREATE TRIGGER trigger_update_lead_on_productivity_log
  AFTER INSERT ON public.lead_productivity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lead_on_productivity_log();