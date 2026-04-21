-- Drop the current trigger and recreate it to run BEFORE other triggers that might override our values
DROP TRIGGER IF EXISTS trigger_handle_assigned_at_thai ON public.leads;

-- Create the trigger to run BEFORE INSERT and UPDATE 
CREATE TRIGGER trigger_handle_assigned_at_thai_before
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_assigned_at_thai();