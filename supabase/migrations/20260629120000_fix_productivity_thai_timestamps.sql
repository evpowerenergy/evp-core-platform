-- Fix lead_productivity_logs trigger to populate next_follow_up_thai
-- Migration: 20260629120000_fix_productivity_thai_timestamps.sql

CREATE OR REPLACE FUNCTION public.update_thailand_timestamps_improved()
RETURNS TRIGGER AS $$
BEGIN
  -- created_at_thai for lead_productivity_logs (and other tables using this trigger)
  IF NEW.created_at IS NOT NULL THEN
    NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
  END IF;

  -- next_follow_up_thai for lead_productivity_logs
  IF TG_TABLE_NAME = 'lead_productivity_logs' THEN
    IF NEW.next_follow_up IS NOT NULL THEN
      NEW.next_follow_up_thai := NEW.next_follow_up + INTERVAL '7 hours';
    ELSE
      NEW.next_follow_up_thai := NULL;
    END IF;
  END IF;

  -- leads and users: updated_at_thai
  IF TG_TABLE_NAME IN ('leads', 'users') THEN
    IF NEW.updated_at IS NULL THEN
      NEW.updated_at := now();
    END IF;
    NEW.updated_at_thai := NEW.updated_at + INTERVAL '7 hours';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists on lead_productivity_logs
DROP TRIGGER IF EXISTS update_logs_thai_time ON public.lead_productivity_logs;

CREATE TRIGGER update_logs_thai_time
  BEFORE INSERT OR UPDATE ON public.lead_productivity_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_thailand_timestamps_improved();

-- Backfill next_follow_up_thai for existing rows
UPDATE public.lead_productivity_logs
SET next_follow_up = next_follow_up
WHERE next_follow_up IS NOT NULL
  AND next_follow_up_thai IS NULL;
