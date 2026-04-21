-- เพิ่ม columns สำหรับหมายเลขใบเสนอราคาและ invoice ใน quotations table
ALTER TABLE public.quotations 
ADD COLUMN quotation_number TEXT,
ADD COLUMN invoice_number TEXT;