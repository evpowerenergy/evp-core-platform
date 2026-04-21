# Deployment Guide for core-leads-lead-management

## ✅ Deployment Status

Function deployed successfully to Supabase production!

**Function URL:**
```
https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-leads-lead-management
```

**Dashboard:**
```
https://supabase.com/dashboard/project/ttfjapfdzrxmbxbarfbn/functions/core-leads-lead-management
```

## Environment Variables Setup

### ตรวจสอบ Environment Variables บน Supabase Dashboard

1. ไปที่ Supabase Dashboard
2. Settings > Edge Functions > Environment Variables
3. ตรวจสอบว่ามี variables เหล่านี้หรือยัง:
   - `SUPABASE_URL` - ควรมีอัตโนมัติ (ใช้ project URL)
   - `SUPABASE_ANON_KEY` - ควรมีอัตโนมัติ (ใช้ anon public key)
   - `VITE_SUPABASE_URL` (optional, fallback)
   - `VITE_SUPABASE_ANON_KEY` (optional, fallback)

### ถ้ายังไม่มี - ตั้งค่าเพิ่ม:

```bash
# Option 1: ใช้ Supabase CLI
supabase secrets set SUPABASE_URL=https://ttfjapfdzrxmbxbarfbn.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your_anon_key

# Option 2: ตั้งค่าผ่าน Dashboard
# Go to: Settings > Edge Functions > Environment Variables
```

## Testing Production Function

### Method 1: ใช้ Test Script

```bash
cd supabase/functions/core-leads-lead-management

# Set your anon key
export SUPABASE_ANON_KEY="your_anon_key_here"

# Run test
./test-production.sh
```

### Method 2: ใช้ curl โดยตรง

```bash
ANON_KEY="your_anon_key_here"
curl -X GET \
  "https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-leads-lead-management?category=Package&includeLeads=true" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" | python3 -m json.tool
```

### Method 3: ใช้ Postman หรือ API Client

**Request:**
- Method: `GET`
- URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-leads-lead-management`
- Headers:
  - `Authorization: Bearer <your_anon_key>`
  - `Content-Type: application/json`
- Query Params:
  - `category=Package`
  - `includeLeads=true`
  - `includeSalesTeam=true`
  - `includeUserData=false`

## Expected Response

เมื่อมีข้อมูลใน database:

```json
{
  "success": true,
  "data": {
    "leads": [...],
    "salesTeam": [...],
    "user": null,
    "salesMember": null,
    "stats": {
      "totalLeads": 10,
      "assignedLeads": 5,
      "unassignedLeads": 5,
      "assignmentRate": 50.0,
     黄金leadsWithContact": 8,
      "contactRate": 80.0
    }
  },
  "meta": {
    "executionTime": "45.23ms",
    "timestamp": "2025-10-31T...",
    "category": "Package",
    ...
  }
}
```

## Troubleshooting

### Function returns empty data
- ตรวจสอบว่า database มีข้อมูลจริง (ไม่ใช่ local)
- ตรวจสอบ RLS policies อนุญาตให้อ่านได้
- ตรวจสอบ category parameter ถูกต้อง

### Authentication errors
- ตรวจสอบ Authorization header ส่งถูกต้อง
- ตรวจสอบ anon key ถูกต้อง
- ตรวจสอบ JWT token ยังไม่หมดอายุ

### Environment variables not found
- ตรวจสอบว่า set environment variables บน Supabase Dashboard แล้ว
- ใช้ `supabase secrets list` เพื่อดู secrets ที่ set ไว้

## Re-deployment

ถ้าต้องการ deploy อีกครั้ง:

```bash
supabase functions deploy core-leads-lead-management --no-verify-jwt
```

## Monitoring

ดู logs และ monitoring:
- Dashboard: https://supabase.com/dashboard/project/ttfjapfdzrxmbxbarfbn/functions/core-leads-lead-management/logs
- CLI: `supabase functions logs core-leads-lead-management`

