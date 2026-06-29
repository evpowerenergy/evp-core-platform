# Facebook Ads Auto Sync — Supabase Secrets

ตั้งค่าใน **Supabase Dashboard → Project Settings → Edge Functions → Secrets**

## Secrets ที่จำเป็น

| Secret | คำอธิบาย |
|--------|----------|
| `FACEBOOK_ACCESS_TOKEN` | Marketing API token (น่าจะมีอยู่แล้ว) |
| `FACEBOOK_AD_ACCOUNT_ID` หรือ `FACEBOOK_AD_ACCOUNT_IDS` | Ad account ID(s) |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Page token สำหรับดึง Caption (ค่าเดียวกับ `VITE_FACEBOOK_PAGE_ACCESS_TOKEN` ใน dev) |
| `FACEBOOK_PAGE_ID` | (แนะนำ) filter story IDs ให้ตรงเพจ |
| `FACEBOOK_PAGES` | (ถ้ามีหลายเพจ) JSON array: `[{"pageId":"...","pageAccessToken":"..."}]` |
| `CRON_SECRET` | (แนะนำ) สำหรับ manual test ด้วย header `x-cron-secret` |

`SUPABASE_SERVICE_ROLE_KEY` มีให้ Edge Function อัตโนมัติ — ไม่ต้องตั้งเอง

## Deploy

```bash
cd evp-core-platform

# Apply migration (ads_sync_runs + unique index)
supabase db push

# Deploy functions
supabase functions deploy marketing-facebook-ads-auto-sync
supabase functions deploy marketing-facebook-ads-sync
```

## ตั้ง Cron

รัน [`RUN_FACEBOOK_ADS_AUTO_SYNC_CRON.sql`](../scripts/run/RUN_FACEBOOK_ADS_AUTO_SYNC_CRON.sql) ใน Supabase SQL Editor

## Monitor

```sql
SELECT * FROM public.ads_sync_runs ORDER BY started_at DESC LIMIT 10;
```

## Test checklist (หลัง deploy)

1. **Manual curl** — ได้ HTTP 200 และ JSON มี `adsFetched`, `upserted`, `caption.enriched`
2. **ads_campaigns** — `updated_at` / `description` อัปเดตหลังรัน
3. **ads_sync_runs** — มีแถว `triggered_by = manual`
4. **UI regression** — ปุ่ม Sync บน `/marketing/ads-management` ยังทำงาน (ใช้ `marketing-facebook-ads-sync` + client upsert)
5. **Cron** — หลังรัน `RUN_FACEBOOK_ADS_AUTO_SYNC_CRON.sql` รอวันถัดไป 07:00 น. แล้วตรวจ `triggered_by = pg_cron`
