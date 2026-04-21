-- Add created_by field to leads table to track who created each lead
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id);

-- Add index for better performance when querying by creator
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON public.leads(created_by);

-- Update the existing triggers to also update created_by when a lead is created
-- The created_by field will be set by the application code, not by trigger

-- Add comment to document the field
COMMENT ON COLUMN public.leads.created_by IS 'User ID who created this lead';

-- Update existing leads to have a default creator (optional)
-- This can be run manually if needed:
-- UPDATE public.leads SET created_by = (SELECT id FROM public.users LIMIT 1) WHERE created_by IS NULL;