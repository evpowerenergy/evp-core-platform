-- สร้าง table สำหรับเก็บหมายเลขเอกสาร (quotation และ invoice) แบบหลายใบ
CREATE TABLE public.quotation_documents (
  id SERIAL PRIMARY KEY,
  productivity_log_id INTEGER NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('quotation', 'invoice')),
  document_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at_thai TIMESTAMP WITH TIME ZONE
);

-- เพิ่ม RLS policies
ALTER TABLE public.quotation_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for authenticated users" 
ON public.quotation_documents 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow select for authenticated users" 
ON public.quotation_documents 
FOR SELECT 
USING (true);

CREATE POLICY "Allow update for authenticated users" 
ON public.quotation_documents 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete for authenticated users" 
ON public.quotation_documents 
FOR DELETE 
USING (true);

-- เพิ่ม trigger สำหรับ Thailand timestamp
CREATE TRIGGER update_quotation_documents_thailand_timestamps
  BEFORE INSERT OR UPDATE ON public.quotation_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_thailand_timestamps();