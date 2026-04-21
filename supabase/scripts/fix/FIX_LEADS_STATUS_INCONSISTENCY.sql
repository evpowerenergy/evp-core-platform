-- 🔧 แก้ไข Leads ที่มีข้อมูลไม่สอดคล้องกันระหว่าง status และ sale_owner_id
-- วัตถุประสงค์: แก้ไข leads ที่มี sale_owner_id แต่ status = "รอรับ" ให้สอดคล้องกัน

-- ⚠️ คำเตือน: Script นี้จะแก้ไขข้อมูลจริงในฐานข้อมูล
-- แนะนำให้รัน CHECK_LEADS_STATUS_INCONSISTENCY.sql ก่อนเพื่อดูข้อมูลที่จะถูกแก้ไข

BEGIN;

-- Step 1: แก้ไข leads ที่มี sale_owner_id แต่ sale_owner_id ไม่มีใน sales_team_with_user_info
-- → ตั้ง sale_owner_id = NULL และ status = 'รอรับ'
UPDATE leads 
SET 
  sale_owner_id = NULL,
  status = 'รอรับ',
  updated_at = now(),
  updated_at_thai = now() + INTERVAL '7 hours'
WHERE sale_owner_id IS NOT NULL 
  AND sale_owner_id NOT IN (SELECT id FROM sales_team_with_user_info)
  AND is_archived = false;

-- Step 2: แก้ไข leads ที่มี sale_owner_id ที่ถูกต้อง แต่ status = "รอรับ"
-- → ตั้ง status = 'กำลังติดตาม' (ตาม logic ของ trigger)
-- แต่ถ้า operation_status = 'ปิดการขายแล้ว' → status = 'ปิดการขาย'
-- แต่ถ้า operation_status = 'ปิดการขายไม่สำเร็จ' → status = 'ยังปิดการขายไม่สำเร็จ'
UPDATE leads 
SET 
  status = CASE
    WHEN operation_status = 'ปิดการขายแล้ว' THEN 'ปิดการขาย'
    WHEN operation_status = 'ปิดการขายไม่สำเร็จ' THEN 'ยังปิดการขายไม่สำเร็จ'
    WHEN operation_status = 'ติดตามหลังการขาย' THEN 'กำลังติดตาม'
    ELSE 'กำลังติดตาม'
  END,
  updated_at = now(),
  updated_at_thai = now() + INTERVAL '7 hours'
WHERE sale_owner_id IS NOT NULL 
  AND sale_owner_id IN (SELECT id FROM sales_team_with_user_info)
  AND status = 'รอรับ'
  AND is_archived = false;

-- Step 3: ตรวจสอบผลลัพธ์
SELECT 
  'After Fix' as check_type,
  COUNT(*) as total_inconsistent_leads,
  COUNT(DISTINCT sale_owner_id) as unique_sale_owners_affected
FROM leads
WHERE sale_owner_id IS NOT NULL 
  AND status = 'รอรับ'
  AND is_archived = false;

COMMIT;

-- 📝 หมายเหตุ:
-- 1. Script นี้จะแก้ไขเฉพาะ leads ที่ is_archived = false
-- 2. การแก้ไขจะอัพเดท updated_at และ updated_at_thai ด้วย
-- 3. ถ้าต้องการดูข้อมูลก่อนแก้ไข ให้รัน CHECK_LEADS_STATUS_INCONSISTENCY.sql ก่อน
-- 4. ถ้าต้องการ rollback ให้ใช้: ROLLBACK; (ก่อน COMMIT)

