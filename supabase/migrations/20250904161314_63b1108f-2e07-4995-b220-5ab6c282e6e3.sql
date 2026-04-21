-- แก้ไข function handle_assigned_at_thai ให้ตั้งค่า assigned_at_thai ได้ถูกต้อง
CREATE OR REPLACE FUNCTION public.handle_assigned_at_thai()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- สำหรับ INSERT: ถ้ามี sale_owner_id ตั้งแต่แรก ให้ assigned_at_thai = now() + 7 ชั่วโมง
  IF TG_OP = 'INSERT' THEN
    IF NEW.sale_owner_id IS NOT NULL THEN
      NEW.assigned_at_thai := now() + INTERVAL '7 hours';
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