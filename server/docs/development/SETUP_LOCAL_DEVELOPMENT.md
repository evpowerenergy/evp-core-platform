# Setup Local Development - Quick Guide

## 🎯 **Overview**

เอกสารนี้สรุปสิ่งที่ต้องทำเพื่อให้ Local Development ทำงานได้สมบูรณ์

---

## ✅ **สถานะปัจจุบัน**

### **สิ่งที่พร้อมแล้ว:**
- ✅ Helper Function: `src/utils/edgeFunctionUrl.ts` (auto-switch local/cloud)
- ✅ Documentation: `AUTO_SWITCH_LOCAL_CLOUD.md`, `HOOKS_MIGRATION_STRATEGY.md`
- ✅ Edge Functions: พร้อมใช้งาน

### **สิ่งที่ยังต้องทำ:**
- ❌ Migrate Hooks: ยังใช้ Cloud URL โดยตรง (14+ hooks)
- ❌ Environment Variables: ยังไม่มี `.env.local` สำหรับ Edge Functions

---

## 📝 **TODO Checklist**

### **1. ตั้งค่า Environment Variables สำหรับ Edge Functions** ⚠️

**สร้างไฟล์ `.env.local` ใน root directory:**

```bash
# Supabase Cloud Configuration (สำหรับ Edge Functions ที่รัน local)
SUPABASE_URL=https://ttfjapfdzrxmbxbarfbn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here (optional)
```

**หรือตั้งค่าใน shell ก่อนรัน `supabase functions serve`:**

```bash
export SUPABASE_URL=https://ttfjapfdzrxmbxbarfbn.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**📌 หมายเหตุ:**
- `.env.local` ควรอยู่ใน `.gitignore` (ไม่ commit secrets)
- `SUPABASE_SERVICE_ROLE_KEY` หาได้จาก Supabase Dashboard → Settings → API

---

### **2. Migrate Frontend Hooks** ⚠️

**Hooks ที่ต้องแก้ (14+ files):**
- `src/hooks/useLeadsAPI.ts`
- `src/hooks/useProductsAPI.ts`
- `src/hooks/useAppDataAPI.ts`
- `src/hooks/useInventoryDataAPI.ts`
- `src/hooks/useCustomerServicesAPI.ts`
- `src/hooks/useSalesTeamAPI.ts`
- `src/hooks/useAppointmentsAPI.ts`
- `src/hooks/useServiceAppointmentsAPI.ts`
- `src/hooks/useServiceVisitsAPI.ts`
- `src/hooks/useLeadDetailAPI.ts`
- `src/hooks/useUserDataAPI.ts`
- `src/hooks/useSaleFollowUpAPI.ts`
- `src/hooks/useProductivityLogSubmissionAPI.ts`
- `src/hooks/useOpenAICost.ts`

**Pattern ที่ต้องแก้:**

**ก่อน (ใช้ Cloud URL โดยตรง):**
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/core-leads-leads-list`;
// หรือ
const edgeFunctionUrl = new URL(`${SUPABASE_URL}/functions/v1/core-leads-leads-list`);
```

**หลัง (ใช้ Helper Function - Auto-Switch):**
```typescript
import { getEdgeFunctionUrl, getEdgeFunctionUrlWithParams } from '@/utils/edgeFunctionUrl';

// สำหรับ URL ที่ไม่มี parameters
const edgeFunctionUrl = getEdgeFunctionUrl('core-leads-leads-list');

// สำหรับ URL ที่มี parameters
const edgeFunctionUrl = getEdgeFunctionUrlWithParams('core-leads-leads-list', {
  category: category || undefined,
  limit: 100
});
```

**📖 ดูรายละเอียด:**
- `api/docs/development/AUTO_SWITCH_LOCAL_CLOUD.md` - วิธีแก้ไข hooks
- `api/docs/development/HOOKS_MIGRATION_STRATEGY.md` - Strategy ในการ migrate

---

## 🚀 **Workflow หลัง Setup เสร็จ**

### **เมื่อแก้ Frontend เท่านั้น:**
```bash
npm run dev
# → ใช้ Cloud Edge Functions อัตโนมัติ ✅
```

### **เมื่อแก้ Backend + Frontend:**
```bash
# Terminal 1: Infrastructure
supabase start

# Terminal 2: Edge Function (ตั้งค่า env vars ก่อน)
export SUPABASE_URL=https://ttfjapfdzrxmbxbarfbn.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_key
supabase functions serve your-function --no-verify-jwt

# Terminal 3: Frontend
npm run dev
# → ใช้ Local Edge Functions อัตโนมัติ ✅ (ถ้า hooks ใช้ helper function)
```

---

## 📌 **สรุป**

| Task | Status | Priority |
|------|--------|----------|
| **Helper Function** | ✅ Ready | - |
| **Environment Variables Setup** | ❌ TODO | ⚠️ High |
| **Migrate Hooks** | ❌ TODO | ⚠️ High |
| **Test Local Development** | ❌ TODO | ⚠️ Medium |

---

**Updated:** 2025-01-27

