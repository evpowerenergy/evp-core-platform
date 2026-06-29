-- RUN IN SUPABASE SQL EDITOR
-- Fix lead_productivity_logs trigger to populate next_follow_up_thai
-- Safe to re-run (idempotent function replace + backfill)

CREATE OR REPLACE FUNCTION public.update_thailand_timestamps_improved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_at IS NOT NULL THEN
    NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
  END IF;

  IF TG_TABLE_NAME = 'lead_productivity_logs' THEN
    IF NEW.next_follow_up IS NOT NULL THEN
      NEW.next_follow_up_thai := NEW.next_follow_up + INTERVAL '7 hours';
    ELSE
      NEW.next_follow_up_thai := NULL;
    END IF;
  END IF;

  IF TG_TABLE_NAME IN ('leads', 'users') THEN
    IF NEW.updated_at IS NULL THEN
      NEW.updated_at := now();
    END IF;
    NEW.updated_at_thai := NEW.updated_at + INTERVAL '7 hours';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_logs_thai_time ON public.lead_productivity_logs;

CREATE TRIGGER update_logs_thai_time
  BEFORE INSERT OR UPDATE ON public.lead_productivity_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_thailand_timestamps_improved();

-- Backfill next_follow_up_thai from existing next_follow_up
UPDATE public.lead_productivity_logs
SET next_follow_up = next_follow_up
WHERE next_follow_up IS NOT NULL
  AND next_follow_up_thai IS NULL;

-- Verify sample: customer 0898332902
SELECT
  l.tel,
  lpl.id AS log_id,
  lpl.next_follow_up,
  lpl.next_follow_up_thai
FROM lead_productivity_logs lpl
JOIN leads l ON l.id = lpl.lead_id
WHERE l.tel = '0898332902'
ORDER BY lpl.created_at DESC
LIMIT 5;
