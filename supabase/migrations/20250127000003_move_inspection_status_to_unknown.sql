-- Migration: Move inspection status to unknown status
-- Date: 2025-01-27
-- Description: 
--   Move records with sub_status "การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้ไขเอกสาร หรือแก้หน้างาน"
--   from "ระหว่างดำเนินการ" to "ไม่สามารถดำเนินการได้" with sub_status "ไม่ทราบสถานะ หรือ เอกสารไม่สมบูรณ์"

-- Update main_status and sub_status
UPDATE public.permit_requests
SET 
  main_status = 'ไม่สามารถดำเนินการได้',
  sub_status = 'ไม่ทราบสถานะ หรือ เอกสารไม่สมบูรณ์'
WHERE sub_status = 'การไฟฟ้าดำเนินการตรวจสอบเรียบร้อย รอดำเนินการแก้ไขเอกสาร หรือแก้หน้างาน'
  AND main_status = 'ระหว่างดำเนินการ';

