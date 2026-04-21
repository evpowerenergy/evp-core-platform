# Development Workflow: แก้ Frontend + Backend พร้อมกัน

## 🎯 **Use Case**

**📌 สถานะปัจจุบัน:**
- ✅ **Production:** ต่อกับ Supabase **Cloud** ทั้งหมด (Database + Edge Functions)
- ⚠️ **Frontend Hooks:** ยังใช้ Cloud URL โดยตรง (ไม่ได้ migrate)
- 🔄 **Local Development:** พร้อมใช้งาน แต่ต้อง migrate hooks + setup env vars ก่อน

---

## 🔄 **Workflow ปัจจุบัน (ณ ตอนนี้)**

### **✅ แก้ Frontend เท่านั้น:**
```bash
npm run dev
# → เห็นผลทันที ✅
# → ใช้ Cloud Edge Functions (อัตโนมัติ)
# → ไม่ต้อง deploy
```

### **⏱️ แก้ Backend (Edge Functions):**
```bash
# 1. แก้โค้ดที่ supabase/functions/your-function/index.ts
# 2. Deploy ไป Production
supabase functions deploy your-function

# 3. รอ ~30ว-1นาที
# 4. เห็นผลใน Production ✅
```

**⚠️ ข้อจำกัด:**
- ต้อง deploy ทุกครั้งที่แก้ Backend
- ใช้เวลา ~30ว-1นาที
- ไม่มี hot reload

---

## 🚀 **Workflow หลัง Migrate Hooks แล้ว**

### **✅ แก้ Frontend เท่านั้น:**
```bash
npm run dev
# → เห็นผลทันที ✅
# → ใช้ Cloud Edge Functions (อัตโนมัติ)
```

### **✅ แก้ Backend + Frontend (Local Development):**
```bash
# Terminal 1: Infrastructure
supabase start

# Terminal 2: Edge Function (ตั้งค่า env vars)
export SUPABASE_URL=https://ttfjapfdzrxmbxbarfbn.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_key
supabase functions serve your-function --no-verify-jwt
# → Hot reload ✅ เห็นผลทันที!

# Terminal 3: Frontend
npm run dev
# → ใช้ Local Edge Functions อัตโนมัติ ✅
```

**✅ ข้อดี:**
- เห็นผลทันที (hot reload)
- ไม่ต้อง deploy ทุกครั้ง
- พัฒนาเร็วขึ้นมาก

---

**⚠️ หมายเหตุ:**
- ตอนนี้ Frontend hooks **ยังใช้ Cloud URL โดยตรง** (14+ hooks)
- **ต้อง migrate hooks ให้ใช้ `getEdgeFunctionUrl()` ก่อน** → ถึงจะใช้ local development ได้
- Helper function พร้อมแล้วที่ `src/utils/edgeFunctionUrl.ts`
- **📖 ดูรายละเอียด:** `HOOKS_MIGRATION_STRATEGY.md`, `SETUP_LOCAL_DEVELOPMENT.md`

---

เมื่อคุณต้องการแก้ไข:
- **Frontend:** React components, hooks, pages
- **Backend:** Edge Functions (`supabase/functions/.../index.ts`)

และต้องการเห็นผลทันทีทั้งสองฝั่ง!

---

## 🚀 **Quick Start**

### **Setup (ทำทุกครั้งที่เปิดคอม/Editor)**

**⚠️ สำคัญ:** ต้องรันทุกครั้งเมื่อเปิดคอมใหม่หรือเปิดโปรเจคครั้งแรก

```bash
# 1. Start Supabase local (ใช้ Cloud Database เพื่อเห็นข้อมูลจริง)
export SUPABASE_URL=https://ttfjapfdzrxmbxbarfbn.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

supabase start

# 2. (Optional) Link project - ไม่จำเป็น! ใช้ env vars ก็พอ
# supabase link --project-ref ttfjapfdzrxmbxbarfbn
```

---

## 💻 **Development Workflow**

### **ทำไมต้องรัน `supabase functions serve` แยก?**

**📌 คำถาม:** `supabase start` ไม่ได้รัน Edge Functions อัตโนมัติหรอ?

**คำตอบ:**
- `supabase start` → รัน Docker containers (PostgreSQL, PostgREST, Auth, etc.)
- `supabase start` → รัน Edge Runtime แต่ **ไม่ใช่ development mode**
- `supabase functions serve` → รัน Edge Functions ใน **development mode** พร้อม **hot reload**

**สรุป:** ต้องรัน 2 คำสั่งแยกกัน
1. `supabase start` → Setup infrastructure (ครั้งเดียว, เปิดทิ้งไว้)
2. `supabase functions serve [function-name]` → รัน function ที่กำลังพัฒนา (มี hot reload)

---

### **Terminal 1: Edge Function (Backend)**
```bash
# Serve Edge Function - เห็นผลทันทีเมื่อแก้ index.ts
supabase functions serve your-feature-name --no-verify-jwt

# Output:
# Serving functions from './supabase/functions'
# Served http://localhost:54321/functions/v1/your-feature-name
# Hot reload enabled!
```

**✅ เมื่อแก้ `supabase/functions/your-feature-name/index.ts`:**
- บันทึกไฟล์ → Hot reload ทันที
- ไม่ต้อง restart terminal
- เห็นผลทันทีใน browser (refresh)

**📝 หมายเหตุ:**
- `--no-verify-jwt` = ไม่ต้องตรวจสอบ JWT token (สำหรับ development)
- ถ้าต้องการ serve หลาย functions พร้อมกัน → เปิดหลาย terminals หรือใช้ script

---

### **Terminal 2: Frontend (React)**
```bash
# Run Frontend
npm run dev

# Output:
# VITE ready in XXX ms
# ➜  Local:   http://localhost:8080/
```

**✅ เมื่อแก้ Frontend code:**
- บันทึกไฟล์ → Hot reload ทันที
- Browser refresh อัตโนมัติ
- เห็นผลทันที

---

## 📝 **Step-by-Step Example**

### **Scenario: แก้ Feature "Get Leads"**

**1. เปิด 2 Terminals:**

```bash
# Terminal 1: Backend (Edge Function)
export SUPABASE_URL=https://ttfjapfdzrxmbxbarfbn.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_key
supabase functions serve core-leads-leads-list --no-verify-jwt

# Terminal 2: Frontend
npm run dev
```

**2. แก้ Backend (`supabase/functions/core-leads-leads-list/index.ts`):**
```typescript
Deno.serve(async (req: Request) => {
  // แก้โค้ดตรงนี้ - เพิ่ม filter ใหม่
  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'active')  // เพิ่ม filter ใหม่
    .limit(100);
  
  // บันทึกไฟล์ (Cmd+S / Ctrl+S) → Hot reload ทันที! ✅
  return new Response(JSON.stringify({ success: true, data }));
});
```
**ผล:** Terminal 1 จะแสดง `Hot reload` → พร้อมใช้แล้ว!

**3. แก้ Frontend (`src/hooks/useLeadsAPI.ts`):**
```typescript
import { getEdgeFunctionUrl } from '@/utils/edgeFunctionUrl';

// แก้โค้ดตรงนี้
const edgeFunctionUrl = getEdgeFunctionUrl('core-leads-leads-list');
// Development: http://localhost:54321/functions/v1/core-leads-leads-list ✅
// Production: จะใช้ cloud URL อัตโนมัติ

const response = await fetch(edgeFunctionUrl, { ... });

// บันทึกไฟล์ (Cmd+S / Ctrl+S) → Hot reload ทันที! ✅
```
**ผล:** Terminal 2 (Frontend) จะ refresh อัตโนมัติ → Browser จะ reload!

**4. Refresh Browser (หรือรอ auto-refresh):**
- Frontend → เรียก `http://localhost:54321/functions/v1/core-leads-leads-list` ✅
- Edge Function → ใช้ Cloud Database → ได้ข้อมูลจริง ✅
- **เห็นผลทันทีทั้ง Frontend และ Backend!** ✅

---

## 🔧 **Configuration**

### **Frontend จะเรียก Local Edge Function:**

**✅ แนะนำ: ใช้ Helper Function ที่สร้างไว้แล้ว**

```typescript
// Import helper function
import { getEdgeFunctionUrl, getEdgeFunctionUrlWithParams } from '@/utils/edgeFunctionUrl';

// Usage 1: Simple URL
const edgeFunctionUrl = getEdgeFunctionUrl('core-leads-leads-list');
// Development: http://localhost:54321/functions/v1/core-leads-leads-list
// Production: https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-leads-leads-list

// Usage 2: With query parameters
const edgeFunctionUrl = getEdgeFunctionUrlWithParams('core-leads-leads-list', {
  category: 'Package',
  limit: 100
});

const response = await fetch(edgeFunctionUrl, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});
```

**📝 Helper Function:** `src/utils/edgeFunctionUrl.ts`
- Development: ใช้ `http://localhost:54321` อัตโนมัติ
- Production: ใช้ Cloud URL อัตโนมัติ
- **⚠️ หมายเหตุ:** Helper function พร้อมแล้ว แต่ hooks ยังไม่ได้ใช้ (ต้องแก้ hooks ก่อน)
- **📖 ดูรายละเอียด:** `AUTO_SWITCH_LOCAL_CLOUD.md`

---

## 🎯 **Complete Workflow**

```bash
# Terminal 1: Backend
export SUPABASE_URL=https://ttfjapfdzrxmbxbarfbn.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_key
supabase functions serve your-feature-name --no-verify-jwt

# Terminal 2: Frontend  
npm run dev

# Terminal 3: (Optional) Watch logs
# ดู logs จาก Edge Function หรือ Frontend
```

**ตอนพัฒนา:**
1. แก้ `supabase/functions/.../index.ts` → บันทึก → เห็นผลทันที
2. แก้ `src/.../Component.tsx` → บันทึก → เห็นผลทันที
3. Refresh browser → เห็นผลรวมทั้ง Frontend + Backend

---

## ✅ **Checklist**

- [ ] Setup environment variables (SUPABASE_URL, etc.)
- [ ] Start Supabase local (`supabase start`)
- [ ] Terminal 1: Serve Edge Function (`supabase functions serve`)
- [ ] Terminal 2: Run Frontend (`npm run dev`)
- [ ] Frontend config: ใช้ `http://localhost:54321` ใน development
- [ ] ทดสอบ: แก้ Backend → เห็นผล
- [ ] ทดสอบ: แก้ Frontend → เห็นผล

---

## 🐛 **Troubleshooting**

### **Frontend ไม่เห็น Backend changes?**

```bash
# ตรวจสอบว่า Edge Function รันอยู่
curl http://localhost:54321/functions/v1/your-feature-name

# ตรวจสอบ logs ใน Terminal 1
```

### **Backend ไม่เห็น Database changes?**

```bash
# ตรวจสอบว่าใช้ Cloud Database
echo $SUPABASE_URL
# ควรเป็น: https://ttfjapfdzrxmbxbarfbn.supabase.co
```

### **Port conflict?**

```bash
# เปลี่ยน port ใน vite.config.ts หรือ
# ใช้ port อื่นสำหรับ Edge Functions
supabase functions serve --port 54322
```

---

## 📚 **Related Documents**

- `DEVELOPMENT_WORKFLOW.md` - Workflow การพัฒนา Edge Functions
- `USING_CLOUD_DATABASE_LOCAL.md` - วิธีใช้ Cloud Database ใน local

---

**Updated:** 2025-01-27

