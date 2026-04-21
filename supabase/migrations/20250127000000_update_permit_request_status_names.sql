-- Migration: Update permit request status names
-- Date: 2025-01-27
-- Description: 
--   1. Update main_status: "ยังไม่ได้ดำเนินการ" → "ไม่สามารถดำเนินการได้"
--   2. Update sub_status: "อยู่ระหว่างการดำเนินการ / จัดทำเล่มเอกสาร" → "รอเอกสารสำคัญเพื่อจัดทำเล่ม"
--   3. Update sub_status: "เอกสารยังไม่สมบูรณ์" → "ไม่ทราบสถานะ หรือ เอกสารไม่สมบูรณ์"

-- Update main_status: "ยังไม่ได้ดำเนินการ" → "ไม่สามารถดำเนินการได้"
UPDATE public.permit_requests
SET main_status = 'ไม่สามารถดำเนินการได้'
WHERE main_status = 'ยังไม่ได้ดำเนินการ';

-- Update sub_status: "อยู่ระหว่างการดำเนินการ / จัดทำเล่มเอกสาร" → "รอเอกสารสำคัญเพื่อจัดทำเล่ม"
UPDATE public.permit_requests
SET sub_status = 'รอเอกสารสำคัญเพื่อจัดทำเล่ม'
WHERE sub_status = 'อยู่ระหว่างการดำเนินการ / จัดทำเล่มเอกสาร';

-- Update sub_status: "เอกสารยังไม่สมบูรณ์" → "ไม่ทราบสถานะ หรือ เอกสารไม่สมบูรณ์"
UPDATE public.permit_requests
SET sub_status = 'ไม่ทราบสถานะ หรือ เอกสารไม่สมบูรณ์'
WHERE sub_status = 'เอกสารยังไม่สมบูรณ์';

-- Add comment for documentation
COMMENT ON COLUMN public.permit_requests.main_status IS 'สถานะหลัก: ไม่สามารถดำเนินการได้, ระหว่างดำเนินการ, ดำเนินการเสร็จสิ้น';
COMMENT ON COLUMN public.permit_requests.sub_status IS 'สถานะย่อย: รอเอกสารสำคัญเพื่อจัดทำเล่ม, ไม่ทราบสถานะ หรือ เอกสารไม่สมบูรณ์, etc.';

