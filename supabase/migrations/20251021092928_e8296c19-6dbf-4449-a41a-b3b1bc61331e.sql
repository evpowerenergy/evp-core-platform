
-- Fix update_lead_status_automatically to handle "ติดตามหลังการขาย" correctly
CREATE OR REPLACE FUNCTION public.update_lead_status_automatically()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only update if necessary fields have changed or it's an INSERT
  IF TG_OP = 'INSERT' OR 
     OLD.sale_owner_id IS DISTINCT FROM NEW.sale_owner_id OR 
     OLD.operation_status IS DISTINCT FROM NEW.operation_status THEN
    
    -- If no sale owner assigned, status should be 'รอรับ'
    IF NEW.sale_owner_id IS NULL THEN
      NEW.status := 'รอรับ';
    -- If operation_status is 'ปิดการขายแล้ว', lead_status should be 'ปิดการขาย'
    ELSIF NEW.operation_status = 'ปิดการขายแล้ว' THEN
      NEW.status := 'ปิดการขาย';
    -- If operation_status is 'ปิดการขายไม่สำเร็จ', lead_status should be 'ยังปิดการขายไม่สำเร็จ'
    ELSIF NEW.operation_status = 'ปิดการขายไม่สำเร็จ' THEN
      NEW.status := 'ยังปิดการขายไม่สำเร็จ';
    -- For 'ติดตามหลังการขาย', treat as active follow-up (not closed sale)
    ELSIF NEW.operation_status = 'ติดตามหลังการขาย' THEN
      IF NEW.sale_owner_id IS NULL THEN
        NEW.status := 'รอรับ';
      ELSE
        NEW.status := 'กำลังติดตาม';
      END IF;
    -- For all other operation_status values with assigned sale owner, status should be 'กำลังติดตาม'
    ELSIF NEW.sale_owner_id IS NOT NULL THEN
      NEW.status := 'กำลังติดตาม';
    END IF;
    
    -- Only update timestamp if status actually changed
    IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
      NEW.updated_at := now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
