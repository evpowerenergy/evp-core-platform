-- สร้าง function ใหม่สำหรับจัดการ assigned_at_thai
CREATE OR REPLACE FUNCTION public.handle_assigned_at_thai()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- สำหรับ INSERT: ถ้ามี sale_owner_id ตั้งแต่แรก ให้ assigned_at_thai = created_at_thai
  IF TG_OP = 'INSERT' THEN
    IF NEW.sale_owner_id IS NOT NULL AND NEW.created_at_thai IS NOT NULL THEN
      NEW.assigned_at_thai := NEW.created_at_thai;
    END IF;
  -- สำหรับ UPDATE: ถ้า sale_owner_id เปลี่ยนจาก NULL เป็นมีค่า ให้ assigned_at_thai = เวลาปัจจุบัน + 7 ชั่วโมง
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.sale_owner_id IS DISTINCT FROM NEW.sale_owner_id AND 
       OLD.sale_owner_id IS NULL AND 
       NEW.sale_owner_id IS NOT NULL THEN
      NEW.assigned_at_thai := now() + INTERVAL '7 hours';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- สร้าง trigger สำหรับตาราง leads
CREATE TRIGGER trigger_handle_assigned_at_thai
    BEFORE INSERT OR UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_assigned_at_thai();