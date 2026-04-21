-- Fix the function search path security warning for the newly created function
CREATE OR REPLACE FUNCTION public.update_lead_on_productivity_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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