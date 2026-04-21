-- สร้าง Storage Bucket สำหรับเก็บเอกสารแนบ
INSERT INTO storage.buckets (id, name, public)
VALUES ('permit-documents', 'permit-documents', true);

-- สร้าง RLS policies สำหรับ bucket
CREATE POLICY "Authenticated users can upload permit documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'permit-documents');

CREATE POLICY "Public can view permit documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'permit-documents');

CREATE POLICY "Authenticated users can delete permit documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'permit-documents');

-- เพิ่ม column สำหรับเก็บ metadata ของไฟล์แนบ
ALTER TABLE permit_requests
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN permit_requests.attachments IS 'Array of attachment metadata: [{name, url, size, type, uploadedAt}]';