-- Migration: Increase field lengths in leads table to prevent data truncation
-- Date: 2025-10-16
-- Purpose: Fix "value too long for type character varying(20)" errors
-- 
-- ⚠️ DEPRECATED: This migration will fail if has_contact_info generated column exists.
-- Use migration 20250117000000_increase_leads_field_lengths_with_generated_column.sql instead.
-- 
-- This migration is kept for reference only. The new migration properly handles
-- the has_contact_info generated column by dropping and recreating it.

-- Increase tel field from 20 to 50 characters
-- This allows for formatted phone numbers with spaces, dashes, extensions, etc.
-- ALTER TABLE public.leads 
-- ALTER COLUMN tel TYPE character varying(50);

-- Increase platform field from 20 to 50 characters  
-- This allows for longer platform names
-- ALTER TABLE public.leads 
-- ALTER COLUMN platform TYPE character varying(50);

-- Add comments for documentation
-- COMMENT ON COLUMN public.leads.tel IS 'Phone number (up to 50 characters to support formatted numbers)';
-- COMMENT ON COLUMN public.leads.platform IS 'Platform/source of the lead (up to 50 characters)';

-- Optional: Add check constraint to ensure phone numbers don't contain invalid characters
-- ALTER TABLE public.leads ADD CONSTRAINT tel_format_check 
--   CHECK (tel ~ '^[0-9\s\-\(\)\+]+$' OR tel IS NULL);

