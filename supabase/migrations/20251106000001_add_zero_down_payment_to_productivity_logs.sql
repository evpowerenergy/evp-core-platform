-- =============================================================================
-- Migration: เพิ่ม column is_zero_down_payment ใน lead_productivity_logs
-- =============================================================================
-- 
-- วัตถุประสงค์:
-- - เพิ่ม field สำหรับเก็บข้อมูลว่าเป็น Zero Down Payment หรือไม่
-- - Type: BOOLEAN (true/false)
-- - Default: false (ไม่ใช่ Zero Down Payment)
-- - Nullable: true (รองรับข้อมูลเก่าที่ไม่มีค่า)
--
-- =============================================================================

-- เพิ่ม column is_zero_down_payment ใน lead_productivity_logs
ALTER TABLE public.lead_productivity_logs
ADD COLUMN IF NOT EXISTS is_zero_down_payment BOOLEAN DEFAULT false;

-- เพิ่ม comment เพื่ออธิบาย column
COMMENT ON COLUMN public.lead_productivity_logs.is_zero_down_payment IS 'เป็น Zero Down Payment (ดาวน์/ฟรีดาวน์) หรือไม่';

-- =============================================================================
-- ✅ เสร็จสิ้น Migration: เพิ่ม is_zero_down_payment column
-- =============================================================================
-- 
-- สรุปการเปลี่ยนแปลง:
-- - เพิ่ม column is_zero_down_payment (BOOLEAN) ใน lead_productivity_logs
-- - Default value: false
-- - Nullable: true (รองรับข้อมูลเก่า)
-- =============================================================================



