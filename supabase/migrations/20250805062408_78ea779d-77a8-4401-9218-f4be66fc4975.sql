-- เพิ่ม foreign key constraints สำหรับ quotation_documents และ quotations
-- ให้เชื่อมโยงกับ lead_productivity_logs ผ่าน productivity_log_id

-- เพิ่ม foreign key สำหรับ quotations table
ALTER TABLE public.quotations 
ADD CONSTRAINT fk_quotations_productivity_log 
FOREIGN KEY (productivity_log_id) 
REFERENCES public.lead_productivity_logs(id) 
ON DELETE CASCADE;

-- เพิ่ม foreign key สำหรับ quotation_documents table  
ALTER TABLE public.quotation_documents 
ADD CONSTRAINT fk_quotation_documents_productivity_log 
FOREIGN KEY (productivity_log_id) 
REFERENCES public.lead_productivity_logs(id) 
ON DELETE CASCADE;