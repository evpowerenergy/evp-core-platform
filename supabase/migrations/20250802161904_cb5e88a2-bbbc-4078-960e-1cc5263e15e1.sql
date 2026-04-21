-- Create storage bucket for QR codes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('qr-codes', 'qr-codes', true);

-- Create storage policies for QR codes bucket
-- Allow authenticated users to upload QR codes
CREATE POLICY "Allow authenticated users to upload QR codes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'qr-codes' AND 
  auth.uid() IS NOT NULL
);

-- Allow public access to view QR codes (since they're not sensitive)
CREATE POLICY "Public can view QR codes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'qr-codes');

-- Allow authenticated users to delete their uploaded QR codes
CREATE POLICY "Allow authenticated users to delete QR codes" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'qr-codes' AND 
  auth.uid() IS NOT NULL
);

-- Allow authenticated users to update QR codes
CREATE POLICY "Allow authenticated users to update QR codes" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'qr-codes' AND 
  auth.uid() IS NOT NULL
);