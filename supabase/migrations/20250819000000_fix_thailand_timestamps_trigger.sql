-- Fix Thailand timestamps trigger conflict
-- Migration: 20250819000000_fix_thailand_timestamps_trigger.sql

-- Drop existing conflicting triggers
DROP TRIGGER IF EXISTS update_leads_thai_time ON public.leads;
DROP TRIGGER IF EXISTS update_users_thai_time ON public.users;
DROP TRIGGER IF EXISTS update_logs_thai_time ON public.lead_productivity_logs;

-- Create improved function that handles both updated_at and thai timestamps
CREATE OR REPLACE FUNCTION update_thailand_timestamps_improved()
RETURNS TRIGGER AS $$
BEGIN
  -- Always update created_at_thai if created_at exists
  IF NEW.created_at IS NOT NULL THEN
    NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
  END IF;
  
  -- For leads and users, handle updated_at and updated_at_thai together
  IF TG_TABLE_NAME IN ('leads', 'users') THEN
    -- Set updated_at to current timestamp if not provided
    IF NEW.updated_at IS NULL THEN
      NEW.updated_at := now();
    END IF;
    
    -- Calculate updated_at_thai from the updated_at value
    NEW.updated_at_thai := NEW.updated_at + INTERVAL '7 hours';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers with improved function
CREATE TRIGGER update_leads_thai_time
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps_improved();

CREATE TRIGGER update_users_thai_time
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps_improved();

CREATE TRIGGER update_logs_thai_time
  BEFORE INSERT OR UPDATE ON public.lead_productivity_logs
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps_improved();

-- Update existing data to fix any inconsistencies
UPDATE public.leads 
SET updated_at = updated_at 
WHERE updated_at_thai IS NULL OR updated_at_thai != (updated_at + INTERVAL '7 hours');

UPDATE public.users 
SET updated_at = updated_at 
WHERE updated_at_thai IS NULL OR updated_at_thai != (updated_at + INTERVAL '7 hours');

UPDATE public.lead_productivity_logs 
SET created_at = created_at 
WHERE created_at_thai IS NULL OR created_at_thai != (created_at + INTERVAL '7 hours');
