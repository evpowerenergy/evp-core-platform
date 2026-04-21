-- Migration: Increase field lengths in leads table to prevent data truncation
-- Date: 2025-01-17
-- Purpose: Fix "value too long for type character varying(20)" errors
-- Note: This migration handles the has_contact_info generated column properly

-- Step 1: Drop the generated column has_contact_info (if it exists)
-- This is necessary because we cannot alter the type of a column used by a generated column
ALTER TABLE public.leads 
DROP COLUMN IF EXISTS has_contact_info;

-- Step 2: Increase tel field from 20 to 50 characters
-- This allows for formatted phone numbers with spaces, dashes, extensions, etc.
ALTER TABLE public.leads 
ALTER COLUMN tel TYPE character varying(50);

-- Step 3: Increase platform field from 20 to 50 characters  
-- This allows for longer platform names
ALTER TABLE public.leads 
ALTER COLUMN platform TYPE character varying(50);

-- Step 4: Recreate the has_contact_info generated column
-- Logic: (tel IS NOT NULL AND tel != '') OR (line_id IS NOT NULL AND line_id != '')
ALTER TABLE public.leads 
ADD COLUMN has_contact_info BOOLEAN 
GENERATED ALWAYS AS (
  (tel IS NOT NULL AND tel != '') OR 
  (line_id IS NOT NULL AND line_id != '')
) STORED;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN public.leads.tel IS 'Phone number (up to 50 characters to support formatted numbers)';
COMMENT ON COLUMN public.leads.platform IS 'Platform/source of the lead (up to 50 characters)';
COMMENT ON COLUMN public.leads.has_contact_info IS 'Generated column: true if lead has tel or line_id contact information';
