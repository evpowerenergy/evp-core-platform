-- =============================================================================
-- Migration: เพิ่ม column down_payment_amount ใน lead_productivity_logs
-- =============================================================================
-- 
-- วัตถุประสงค์:
-- - เพิ่ม field สำหรับเก็บค่าเงินดาวน์
-- - Type: NUMERIC (รองรับทศนิยม)
-- - Default: NULL (ยังไม่กำหนดค่า)
-- - Nullable: true (รองรับข้อมูลเก่าที่ไม่มีค่า)
--
-- =============================================================================

-- เพิ่ม column down_payment_amount ใน lead_productivity_logs
ALTER TABLE public.lead_productivity_logs
ADD COLUMN IF NOT EXISTS down_payment_amount NUMERIC(12, 2) DEFAULT NULL;

-- เพิ่ม comment เพื่ออธิบาย column
COMMENT ON COLUMN public.lead_productivity_logs.down_payment_amount IS 'ค่าเงินดาวน์ (บาท)';

-- =============================================================================
-- ✅ เสร็จสิ้น Migration: เพิ่ม down_payment_amount column
-- =============================================================================
-- 
-- สรุปการเปลี่ยนแปลง:
-- - เพิ่ม column down_payment_amount (NUMERIC(12,2)) ใน lead_productivity_logs
-- - Default value: NULL
-- - Nullable: true (รองรับข้อมูลเก่า)
-- =============================================================================

