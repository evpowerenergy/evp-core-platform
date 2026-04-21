
-- Create trigger to automatically create lead when sale_follow_up_status changes to 'completed'
CREATE OR REPLACE TRIGGER trigger_create_lead_on_follow_up_complete
  AFTER UPDATE OF sale_follow_up_status ON public.customer_services
  FOR EACH ROW
  WHEN (NEW.sale_follow_up_status = 'completed' AND (OLD.sale_follow_up_status IS DISTINCT FROM 'completed'))
  EXECUTE FUNCTION public.create_lead_from_customer_service_trigger();
