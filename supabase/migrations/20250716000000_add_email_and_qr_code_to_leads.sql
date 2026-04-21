-- Add email and qr_code fields to leads table
-- Migration: 20250716000000_add_email_and_qr_code_to_leads.sql

-- Add email field
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email character varying(255);

-- Add qr_code field for storing QR code image URL
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS qr_code text;

-- Add comments for documentation
COMMENT ON COLUMN public.leads.email IS 'Email address of the lead';
COMMENT ON COLUMN public.leads.qr_code IS 'URL or path to QR code image';

-- Create index on email for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- Update the updated_at trigger to include new fields
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;

-- Create trigger for updated_at
CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON public.leads 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column(); 