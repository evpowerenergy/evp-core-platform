-- 🔧 ปรับปรุง Trigger เพื่อป้องกันข้อมูลไม่สอดคล้องกัน
-- วัตถุประสงค์: ให้ trigger ตรวจสอบและแก้ไข status เมื่อมีการอัพเดท status โดยตรง

CREATE OR REPLACE FUNCTION public.update_lead_status_automatically()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only update if necessary fields have changed or it's an INSERT
  IF TG_OP = 'INSERT' OR 
     OLD.sale_owner_id IS DISTINCT FROM NEW.sale_owner_id OR 
     OLD.operation_status IS DISTINCT FROM NEW.operation_status OR
     OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- ✅ เพิ่มการตรวจสอบ: ถ้ามีการอัพเดท status โดยตรง ให้ตรวจสอบความสอดคล้องกัน
    -- ถ้า sale_owner_id IS NOT NULL แต่ status = 'รอรับ' → แก้ไข status
    IF NEW.sale_owner_id IS NOT NULL AND NEW.status = 'รอรับ' THEN
      -- แก้ไข status ตาม operation_status
      IF NEW.operation_status = 'ปิดการขายแล้ว' THEN
        NEW.status := 'ปิดการขาย';
      ELSIF NEW.operation_status = 'ปิดการขายไม่สำเร็จ' THEN
        NEW.status := 'ยังปิดการขายไม่สำเร็จ';
      ELSIF NEW.operation_status = 'ติดตามหลังการขาย' THEN
        NEW.status := 'กำลังติดตาม';
      ELSE
        NEW.status := 'กำลังติดตาม';
      END IF;
    END IF;
    
    -- Logic เดิม: อัพเดท status ตาม sale_owner_id และ operation_status
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

-- 📝 หมายเหตุ:
-- 1. Trigger นี้จะตรวจสอบและแก้ไข status เมื่อมีการอัพเดท status โดยตรง
-- 2. ถ้า sale_owner_id IS NOT NULL แต่ status = 'รอรับ' → จะแก้ไข status อัตโนมัติ
-- 3. จะช่วยป้องกันข้อมูลไม่สอดคล้องกันในอนาคต

