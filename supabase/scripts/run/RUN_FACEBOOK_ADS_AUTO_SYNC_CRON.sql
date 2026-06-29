-- =============================================================================
-- รันใน Supabase SQL Editor (Dashboard → SQL → New query)
-- =============================================================================
-- Purpose: ตั้ง pg_cron เรียก marketing-facebook-ads-auto-sync ทุกวัน 07:00 น. ไทย
-- ก่อนรัน: deploy Edge Function + apply migration ads_sync_runs + ตั้ง Secrets
-- =============================================================================

-- 1) เปิด extensions (ข้ามถ้าเปิดแล้ว)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2) เก็บ secrets ใน Vault (รันครั้งเดียว — แทน YOUR_* ด้วยค่าจริง)
-- SELECT vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
-- SELECT vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'service_role_key');

-- 3) ลบ job เดิมถ้ามี (รันเมื่อต้องการอัปเดต schedule)
-- SELECT cron.unschedule('sync-facebook-ads-daily');

-- 4) สร้าง cron job — 00:00 UTC = 07:00 น. ไทย
SELECT cron.schedule(
  'sync-facebook-ads-daily',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/marketing-facebook-ads-auto-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{"statusFilter":"all","triggeredBy":"pg_cron"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

-- =============================================================================
-- ตรวจสอบหลังตั้งค่า
-- =============================================================================
-- ดู cron jobs:
-- SELECT * FROM cron.job WHERE jobname = 'sync-facebook-ads-daily';

-- ดูประวัติรัน cron:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- ดูผล sync จริง (สำคัญ — pg_net เป็น fire-and-forget):
-- SELECT * FROM public.ads_sync_runs ORDER BY started_at DESC LIMIT 10;

-- =============================================================================
-- ทดสอบชั่วคราว (รันทุกนาที) — ลบหลังทดสอบเสร็จ
-- =============================================================================
/*
SELECT cron.unschedule('sync-facebook-ads-daily');
SELECT cron.schedule(
  'sync-facebook-ads-daily-test',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/marketing-facebook-ads-auto-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{"statusFilter":"all","triggeredBy":"pg_cron_test"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
-- หลังทดสอบ:
-- SELECT cron.unschedule('sync-facebook-ads-daily-test');
-- แล้วรัน schedule จริง (ขั้นตอน 4) อีกครั้ง
*/

-- =============================================================================
-- Manual test ด้วย curl (ไม่ต้องรอ cron)
-- =============================================================================
/*
curl -X POST \
  "https://YOUR_PROJECT_REF.supabase.co/functions/v1/marketing-facebook-ads-auto-sync" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"statusFilter":"all","triggeredBy":"manual"}'
*/
