-- =============================================================================
-- รันใน Supabase SQL Editor (Dashboard → SQL → New query)
-- =============================================================================
-- Purpose: สร้างตาราง ads_sync_runs + unique index สำหรับ auto sync
-- รันก่อน: deploy Edge Function marketing-facebook-ads-auto-sync
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ads_sync_runs (
  id bigserial PRIMARY KEY,
  triggered_by text NOT NULL DEFAULT 'pg_cron',
  status text NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  ads_fetched int DEFAULT 0,
  upserted int DEFAULT 0,
  failed int DEFAULT 0,
  caption_total int DEFAULT 0,
  caption_enriched int DEFAULT 0,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms int
);

CREATE INDEX IF NOT EXISTS ads_sync_runs_started_at_idx
  ON public.ads_sync_runs (started_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ads_campaigns_facebook_ad_id_key
  ON public.ads_campaigns (facebook_ad_id)
  WHERE facebook_ad_id IS NOT NULL;

ALTER TABLE public.ads_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Marketing roles can read ads_sync_runs" ON public.ads_sync_runs;
CREATE POLICY "Marketing roles can read ads_sync_runs"
  ON public.ads_sync_runs
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_manager()
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.role IN ('manager_marketing', 'super_admin')
    )
  );

GRANT SELECT ON public.ads_sync_runs TO authenticated;
GRANT ALL ON public.ads_sync_runs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ads_sync_runs_id_seq TO service_role;

-- ทดสอบหลังรัน:
-- SELECT * FROM public.ads_sync_runs ORDER BY started_at DESC LIMIT 5;
