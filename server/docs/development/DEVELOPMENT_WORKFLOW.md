# Development Workflow Guide

## 🎯 **Overview**

เอกสารนี้อธิบาย workflow การพัฒนา Backend API สำหรับ EV Power Energy CRM

**สถานะปัจจุบัน:**
- ✅ Frontend ใช้ Supabase Edge Functions ทั้งหมดแล้ว (77 files)
- ✅ Migration เสร็จสมบูรณ์แล้ว (34 endpoints = 34 functions)
- ✅ Local API ไม่ได้ถูก Frontend เรียกใช้แล้ว

---

## 🚀 **Workflow การพัฒนา Feature ใหม่**

### **Option 1: เขียน Edge Functions โดยตรง (แนะนำ)** ⭐

**สำหรับ:** Feature ใหม่, API ใหม่

**ขั้นตอน:**

1. **สร้าง Edge Function**
   ```bash
   mkdir -p supabase/functions/your-feature-name
   ```

2. **เขียนโค้ดที่ `supabase/functions/your-feature-name/index.ts`**
   ```typescript
   /// <reference path="./deno.d.ts" />
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
   };

   Deno.serve(async (req: Request) => {
     // Handle preflight
     if (req.method === 'OPTIONS') {
       return new Response(null, { headers: corsHeaders, status: 200 });
     }

     // Your logic here
     const supabaseUrl = Deno.env.get('SUPABASE_URL');
     const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
     const supabase = createClient(supabaseUrl!, supabaseKey!);

     // ... your implementation
     
     return new Response(
       JSON.stringify({ success: true, data: {} }),
       {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 200
       }
     );
   });
   ```

3. **สร้าง Config Files**
   - `deno.json` - Deno configuration
   - `deno.d.ts` - Type declarations
   - `tsconfig.json` - TypeScript config (optional, for IDE)

4. **ทดสอบ Local (แนะนำมาก! - เห็นผลทันที)** ⭐
   ```bash
   # Start Supabase local (ครั้งแรกเท่านั้น)
   supabase start
   # จะรัน Docker containers สำหรับ Supabase local
   
   # Serve function locally - เห็นผลทันทีเหมือน localhost!
   supabase functions serve your-feature-name --no-verify-jwt
   # Function จะรันที่: http://localhost:54321/functions/v1/your-feature-name
   # แก้โค้ดแล้ว refresh → เห็นผลทันที! (hot reload)
   ```
   
   **✅ ข้อดี:**
   - เห็นผลทันทีเหมือน localhost
   - Hot reload (แก้โค้ดแล้วเห็นผลทันที)
   - ไม่ต้อง deploy ทุกครั้ง
   - Debug ง่าย
   - ใช้ได้ทั้ง Frontend และ curl

5. **Deploy ไป Production**
   ```bash
   supabase functions deploy your-feature-name
   ```

6. **ใช้ใน Frontend**
   ```typescript
   const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
   const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/your-feature-name`;
   
   const response = await fetch(edgeFunctionUrl, {
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json',
     },
   });
   ```

**ข้อดี:**
- ✅ ไม่ต้อง migrate ภายหลัง
- ✅ Frontend ใช้ได้ทันที
- ✅ Production-ready
- ✅ มี TypeScript support
- ✅ **ใช้ Supabase Local Development ได้** - เห็นผลทันทีเหมือน localhost!

**ข้อเสีย:**
- ⚠️ ต้อง setup Supabase CLI
- ⚠️ ต้องรัน `supabase start` ก่อน (แต่ครั้งเดียว)
- ⚠️ ถ้าไม่ใช้ local development จะต้อง deploy ทุกครั้งที่แก้ไข (ช้า)

---

### **Option 2: เขียน Local API ก่อน แล้วค่อย Migrate** 🔄

**สำหรับ:** Feature ใหญ่, ต้องการพัฒนาและทดสอบเร็ว

**ขั้นตอน:**

1. **เขียน Local API ที่ `api/endpoints/...`**
   - ใช้ Node.js/TypeScript ธรรมดา
   - ทดสอบผ่าน `vite-plugin-api.ts` (localhost:8080)

2. **ทดสอบและพัฒนาให้เสร็จ**

3. **Migrate ไป Edge Functions**
   - Copy logic จาก Local API
   - แปลงเป็น Deno format
   - Deploy

**ข้อดี:**
- ✅ พัฒนาเร็ว (ไม่ต้อง deploy)
- ✅ Hot reload
- ✅ Debug ง่าย

**ข้อเสีย:**
- ⚠️ ต้อง migrate ภายหลัง
- ⚠️ อาจมี logic ไม่ตรงกัน

---

## 📋 **Naming Conventions**

### **Edge Functions**
```
core-{category}-{feature}
additional-{category}-{feature}
system-{category}-{feature}
```

**ตัวอย่าง:**
- `core-leads-lead-management`
- `additional-customer-customer-services`
- `system-management-products-management`

### **File Structure**
```
supabase/functions/
├── {function-name}/
│   ├── index.ts          # Main handler
│   ├── deno.json         # Deno config
│   ├── deno.d.ts         # Type declarations
│   └── tsconfig.json     # TypeScript config (optional)
```

---

## 🛠️ **Development Best Practices**

### **1. Response Format**
```typescript
// Standard response format
{
  success: boolean,
  data?: any,
  meta?: {
    total?: number,
    page?: number,
    limit?: number
  },
  error?: string | {
    message: string,
    code?: string
  }
}
```

### **2. Error Handling**
```typescript
try {
  // Your logic
} catch (error: any) {
  console.error('❌ Error:', error);
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: error.message 
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    }
  );
}
```

### **3. Authentication**
```typescript
// Get JWT from Authorization header
const authHeader = req.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');

// Use Anon key for RLS
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl!, supabaseKey!);

// Forward JWT in Authorization header
const response = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .auth(token || '');
```

### **4. CORS Headers**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

---

## 📚 **Shared Code**

ใช้ `supabase/functions/_shared/` สำหรับ code ที่ใช้ร่วมกัน:

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

---

## 🔍 **Testing**

### **Local Testing (แนะนำสำหรับ Development)** ⭐

**Setup (ครั้งแรกเท่านั้น):**
```bash
# Start Supabase local - รัน Docker containers
supabase start

# จะได้:
# - API URL: http://localhost:54321
# - Functions URL: http://localhost:54321/functions/v1
# - Studio: http://localhost:54323
# - Database: Local PostgreSQL (ใน Docker) - Data อยู่บนเครื่อง
```

**📌 เกี่ยวกับ Database:**

### **Option 1: Local Database (Default)**
- Data อยู่บนเครื่อง (isolated)
- ปลอดภัย (ไม่กระทบ production data)
- ต้อง seed/migrate data เอง

### **Option 2: ใช้ Cloud Database (สำหรับเห็นข้อมูลจริง)** ✅

**วิธีที่ 1: ตั้งค่า Environment Variables ใน Edge Functions**

สร้างไฟล์ `.env.local` หรือตั้งค่า environment variables:

```bash
# ใน Edge Functions ให้ใช้ Cloud Database
SUPABASE_URL=https://ttfjapfdzrxmbxbarfbn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

แก้ไข Edge Function ให้ใช้ environment variables:
```typescript
// ใน index.ts
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 
  'https://ttfjapfdzrxmbxbarfbn.supabase.co'; // Fallback to cloud
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 
  Deno.env.get('SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);
```

เมื่อรัน `supabase functions serve` จะใช้ Cloud Database อัตโนมัติ

**วิธีที่ 2: Link Project (ใช้ Cloud Database โดยตรง)**
```bash
# Link กับ cloud project
supabase link --project-ref ttfjapfdzrxmbxbarfbn

# Start local แต่ใช้ cloud database
supabase start
```

⚠️ **ระวัง:**
- จะใช้ **data จริง** จาก cloud
- การแก้ไข/ลบจะกระทบ production data
- แนะนำให้ใช้ READ-only operations หรือ test กับ dev branch

**Development Workflow:**
```bash
# Terminal 1: Serve function - เห็นผลทันทีเมื่อแก้โค้ด!
supabase functions serve your-feature-name --no-verify-jwt

# Terminal 2: Run Frontend
npm run dev

# Frontend จะเรียก: http://localhost:54321/functions/v1/your-feature-name
# แก้โค้ดที่ index.ts → refresh browser → เห็นผลทันที! ✅
```

**Test with curl:**
```bash
curl http://localhost:54321/functions/v1/your-feature-name \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**✅ ข้อดี:**
- เห็นผลทันทีเหมือน localhost
- Hot reload (แก้โค้ดแล้วเห็นผลทันที)
- ไม่ต้อง deploy
- Debug ง่าย
- ใช้ได้ทั้ง Frontend และ curl

**⚠️ หมายเหตุ:**
- ต้องรัน `supabase start` ก่อน (ครั้งเดียว)
- ถ้าไม่รัน local development จะต้อง deploy ทุกครั้ง (ช้า)

### **Production Testing**
```bash
# Deploy
supabase functions deploy your-feature-name

# Test from Frontend
# หรือใช้ Supabase Dashboard: Functions → Test
```

---

## 📝 **Checklist สำหรับ Feature ใหม่**

- [ ] สร้าง Edge Function directory
- [ ] เขียน handler (index.ts)
- [ ] สร้าง config files (deno.json, deno.d.ts)
- [ ] Implement authentication
- [ ] Handle CORS และ OPTIONS
- [ ] Error handling
- [ ] Response format มาตรฐาน
- [ ] ทดสอบ local
- [ ] Deploy ไป Production
- [ ] อัพเดท Frontend hook
- [ ] ทดสอบ integration
- [ ] อัพเดท Documentation

---

## 🎯 **คำแนะนำ**

### **ใช้ Option 1 (เขียน Edge Functions โดยตรง)** เมื่อ:
- ✅ Feature ใหม่ ไม่ซับซ้อน
- ✅ **ใช้ Supabase Local Development** - เห็นผลทันทีเหมือน localhost
- ✅ มีประสบการณ์กับ Edge Functions แล้ว

### **ใช้ Option 2 (เขียน Local API ก่อน)** เมื่อ:
- ✅ Feature ใหญ่ ซับซ้อนมาก
- ✅ **ต้องการพัฒนาเร็วมาก** (Local API hot reload เร็วกว่า)
- ✅ ยังไม่คุ้นเคยกับ Edge Functions/Deno
- ✅ ต้องการใช้ Node.js libraries ที่ไม่มีใน Deno

**💡 คำแนะนำ:**
- **ใช้ Option 1 + Local Development** สำหรับ 90% ของ cases (แนะนำ)
- **ใช้ Option 2** เฉพาะเมื่อต้องการ Node.js features ที่ Deno ไม่รองรับ

---

## 📖 **Reference**

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Runtime Docs](https://deno.land/manual)
- `EDGE_MIGRATION_PLAN.md` - สำหรับดู pattern จาก migration ที่เสร็จแล้ว

---

**Updated:** 2025-01-27

