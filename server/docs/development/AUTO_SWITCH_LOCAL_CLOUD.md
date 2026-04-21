# Auto-Switch ระหว่าง Local และ Cloud Edge Functions

## 🎯 **Overview**

เอกสารนี้อธิบายวิธีทำให้ Frontend **auto-switch** ระหว่าง Local และ Cloud Edge Functions อัตโนมัติ

---

## 📌 **สถานะปัจจุบัน**

### **✅ Helper Function พร้อมแล้ว:**
- `src/utils/edgeFunctionUrl.ts` - Auto-switch ตาม `import.meta.env.DEV`
- Development: ใช้ `http://localhost:54321`
- Production: ใช้ Cloud URL

### **❌ ปัญหา:**
- Frontend hooks **78 files** ยังใช้ Cloud URL โดยตรง (`${SUPABASE_URL}/functions/v1/...`)
- **ไม่ได้ auto-switch** ไป local อัตโนมัติ
- ต้องแก้ hooks ให้ใช้ helper function

---

## 🔄 **วิธีทำให้ Auto-Switch**

### **ขั้นตอนที่ 1: ใช้ Helper Function ใน Hooks**

**ตัวอย่าง: แก้ `useLeadsAPI.ts`**

**ก่อนแก้ (ใช้ Cloud URL โดยตรง):**
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
const edgeFunctionUrl = new URL(`${SUPABASE_URL}/functions/v1/core-leads-leads-list`);
```

**หลังแก้ (ใช้ Helper Function - auto-switch):**
```typescript
import { getEdgeFunctionUrlWithParams } from '@/utils/edgeFunctionUrl';

const edgeFunctionUrl = getEdgeFunctionUrlWithParams('core-leads-leads-list', {
  category: category || undefined
});
// Development: http://localhost:54321/functions/v1/core-leads-leads-list?category=Package
// Production: https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-leads-leads-list?category=Package
```

---

## ✅ **Workflow ที่ได้หลังแก้**

### **1. แก้ Frontend เท่านั้น:**
```bash
npm run dev
```
- ✅ ใช้ **Cloud Edge Functions** อัตโนมัติ (เพราะ `import.meta.env.DEV` = true แต่ไม่รัน local)
- ✅ ไม่ต้องรัน `supabase start`

### **2. แก้ Backend + Frontend:**
```bash
# Terminal 1: Infrastructure
supabase start

# Terminal 2: Edge Function ที่กำลังพัฒนา
supabase functions serve core-leads-leads-list --no-verify-jwt

# Terminal 3: Frontend
npm run dev
```
- ✅ ใช้ **Local Edge Functions** อัตโนมัติ (`import.meta.env.DEV` = true + local function รันอยู่)
- ✅ Auto-switch ไป local เมื่อ `npm run dev` + `supabase functions serve` รันอยู่

---

## 🎯 **การทำงานของ Helper Function**

```typescript
export function getEdgeFunctionUrl(functionName: string): string {
  // Development mode (npm run dev)
  if (import.meta.env.DEV) {
    return `http://localhost:54321/functions/v1/${functionName}`;
    // ⚠️ ถ้า local function ไม่ได้รัน → จะ error
    // ✅ ถ้ารัน supabase functions serve → ใช้ local
  }
  
  // Production mode
  return `${SUPABASE_URL}/functions/v1/${functionName}`;
  // ใช้ Cloud URL
}
```

**Logic:**
- `import.meta.env.DEV` = `true` เมื่อ `npm run dev`
- ถ้า local function รันอยู่ → ใช้ local ✅
- ถ้า local function ไม่ได้รัน → จะ error (ต้องรัน `supabase functions serve`)

---

## 📝 **Checklist: แก้ Hooks ให้ Auto-Switch**

### **Pattern ที่ต้องแก้:**

**ก่อนแก้:**
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '...';
const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/function-name`;
```

**หลังแก้:**
```typescript
import { getEdgeFunctionUrl, getEdgeFunctionUrlWithParams } from '@/utils/edgeFunctionUrl';

// Simple URL
const edgeFunctionUrl = getEdgeFunctionUrl('function-name');

// With params
const edgeFunctionUrl = getEdgeFunctionUrlWithParams('function-name', {
  param1: value1,
  param2: value2
});
```

### **Hooks ที่ต้องแก้:**
- `useLeadsAPI.ts`
- `useAppDataAPI.ts`
- `useInventoryDataAPI.ts`
- `useCustomerServicesAPI.ts`
- และ hooks อื่นๆ ที่ใช้ `${SUPABASE_URL}/functions/v1/...` (78 files)

---

## ⚠️ **ข้อควรระวัง**

### **ถ้าใช้ Local Edge Functions:**
- ⚠️ **ต้องรัน** `supabase functions serve` ก่อน
- ⚠️ ถ้าไม่รัน → จะได้ error `Failed to fetch` หรือ connection refused
- ✅ แก้ Backend → เห็นผลทันที (hot reload)

### **ถ้าใช้ Cloud Edge Functions:**
- ✅ ไม่ต้องรันอะไร
- ⚠️ แก้ Backend → ต้อง deploy ก่อนเห็นผล
- ✅ เหมาะสำหรับ Production testing

---

## 🔄 **สรุป Workflow**

### **Scenario 1: แก้ Frontend เท่านั้น**
```bash
npm run dev
# → ใช้ Cloud Edge Functions (auto) ✅
```

### **Scenario 2: แก้ Backend + Frontend**
```bash
# Terminal 1
supabase start

# Terminal 2  
supabase functions serve your-function --no-verify-jwt

# Terminal 3
npm run dev
# → ใช้ Local Edge Functions (auto) ✅
```

---

## 📚 **Related**

- `FRONTEND_BACKEND_DEVELOPMENT.md` - Workflow การพัฒนา Frontend + Backend
- `DAILY_WORKFLOW.md` - Workflow ทุกวัน

---

**Updated:** 2025-01-27

