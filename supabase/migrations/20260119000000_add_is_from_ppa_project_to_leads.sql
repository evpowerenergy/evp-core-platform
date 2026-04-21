-- =============================================================================
-- Migration: เพิ่ม field is_from_ppa_project ใน table leads
-- =============================================================================
-- 
-- วัตถุประสงค์: เพิ่ม field ใหม่เพื่อบันทึกว่าลีดมาจากโครงการ PPA 
-- (Power Purchase Agreement) หรือไม่
--
-- PPA เป็นโครงการแยกต่างหาก ไม่ใช่ subtype ของ platform
-- ทั้ง Package และ Wholesale สามารถเป็น PPA ได้
-- =============================================================================

-- เพิ่ม field is_from_ppa_project
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS is_from_ppa_project BOOLEAN DEFAULT false;

-- Index สำหรับ performance (เฉพาะ records ที่เป็น PPA)
-- ใช้ partial index เพราะส่วนใหญ่จะเป็น false
CREATE INDEX IF NOT EXISTS idx_leads_is_from_ppa_project 
ON public.leads(is_from_ppa_project) 
WHERE is_from_ppa_project = true;

-- Comment สำหรับ documentation
COMMENT ON COLUMN public.leads.is_from_ppa_project IS 
'ลีดมาจากโครงการ PPA (Power Purchase Agreement) หรือไม่. Default: false. PPA เป็นโครงการแยกต่างหาก ไม่ใช่ subtype ของ platform';

-- =============================================================================
-- ✅ เสร็จสิ้น Migration: เพิ่ม field แล้ว
-- =============================================================================
-- 
-- ขั้นตอนต่อไป:
-- 1. อัปเดต function safe_insert_lead_with_duplicate_check() ให้รองรับ field ใหม่
-- 2. อัปเดต backend APIs ให้รับ is_from_ppa_project
-- 3. อัปเดต frontend form ให้มี checkbox
-- 4. อัปเดต UI ให้แสดง badge และ filter
-- =============================================================================
