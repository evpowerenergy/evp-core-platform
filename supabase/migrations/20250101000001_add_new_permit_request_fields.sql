-- เพิ่ม fields ใหม่สำหรับ permit_requests table
-- เพื่อรองรับข้อมูลที่ได้รับใหม่

-- เพิ่ม columns ใหม่
ALTER TABLE public.permit_requests 
ADD COLUMN IF NOT EXISTS operator_name TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS document_number TEXT,
ADD COLUMN IF NOT EXISTS requested_name TEXT,
ADD COLUMN IF NOT EXISTS document_received_date DATE,
ADD COLUMN IF NOT EXISTS completion_date DATE,
ADD COLUMN IF NOT EXISTS online_date DATE,
ADD COLUMN IF NOT EXISTS team_leader TEXT,
ADD COLUMN IF NOT EXISTS connection_type TEXT,
ADD COLUMN IF NOT EXISTS meter_number TEXT,
ADD COLUMN IF NOT EXISTS permit_number TEXT,
ADD COLUMN IF NOT EXISTS map_reference TEXT;

-- เพิ่ม comments สำหรับ columns ใหม่
COMMENT ON COLUMN public.permit_requests.operator_name IS 'ผู้ดำเนินการขออนุญาต';
COMMENT ON COLUMN public.permit_requests.company_name IS 'บริษัท';
COMMENT ON COLUMN public.permit_requests.document_number IS 'เลขที่เอกสาร';
COMMENT ON COLUMN public.permit_requests.requested_name IS 'ชื่อที่ขออนุญาต';
COMMENT ON COLUMN public.permit_requests.document_received_date IS 'วันที่รับเอกสาร';
COMMENT ON COLUMN public.permit_requests.completion_date IS 'วันที่ดำเนินการเสร็จ';
COMMENT ON COLUMN public.permit_requests.online_date IS 'วันที่ออนระบบ';
COMMENT ON COLUMN public.permit_requests.team_leader IS 'ผู้คุมงาน + ทีมช่าง';
COMMENT ON COLUMN public.permit_requests.connection_type IS 'ขนาน/ขาย';
COMMENT ON COLUMN public.permit_requests.meter_number IS 'เลขมิเตอร์';
COMMENT ON COLUMN public.permit_requests.permit_number IS 'เลขที่ขออนุญาต';
COMMENT ON COLUMN public.permit_requests.map_reference IS 'MAP';

-- เพิ่ม indexes สำหรับ fields ที่ใช้ค้นหาบ่อย
CREATE INDEX IF NOT EXISTS idx_permit_requests_document_number ON public.permit_requests(document_number);
CREATE INDEX IF NOT EXISTS idx_permit_requests_permit_number ON public.permit_requests(permit_number);
CREATE INDEX IF NOT EXISTS idx_permit_requests_meter_number ON public.permit_requests(meter_number);
CREATE INDEX IF NOT EXISTS idx_permit_requests_company_name ON public.permit_requests(company_name);
CREATE INDEX IF NOT EXISTS idx_permit_requests_document_received_date ON public.permit_requests(document_received_date);
CREATE INDEX IF NOT EXISTS idx_permit_requests_completion_date ON public.permit_requests(completion_date);
CREATE INDEX IF NOT EXISTS idx_permit_requests_online_date ON public.permit_requests(online_date);
