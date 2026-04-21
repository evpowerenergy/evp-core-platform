-- ลบ legacy fields ที่ไม่ใช้แล้วออกจาก quotations table
-- เนื่องจากระบบใหม่ใช้ quotation_documents table แทน

-- ลบ column quotation_number
ALTER TABLE public.quotations DROP COLUMN IF EXISTS quotation_number;

-- ลบ column invoice_number  
ALTER TABLE public.quotations DROP COLUMN IF EXISTS invoice_number;

-- หมายเหตุ: ระบบใหม่จะใช้ quotation_documents table สำหรับเก็บหมายเลขเอกสาร
-- ซึ่งรองรับหลายเอกสารต่อ 1 productivity log ได้
