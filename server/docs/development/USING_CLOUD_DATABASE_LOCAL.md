# วิธีใช้ Cloud Database ใน Local Development

## 🎯 **Overview**

เอกสารนี้อธิบายวิธีตั้งค่าให้ **Edge Functions (รัน local)** ใช้ **Cloud Database** แทน Local Database เพื่อเห็นข้อมูลจริงตอนพัฒนา

---

## 🚀 **Quick Start**

### **วิธีที่ 1: ใช้ Environment Variables (แนะนำ)** ✅

**Setup (ครั้งเดียว):**

1. **สร้างไฟล์ `.env.local` ใน root directory:**
   ```bash
   SUPABASE_URL=https://ttfjapfdzrxmbxbarfbn.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **แก้ไข Edge Functions ให้ใช้ environment variables:**
   ```typescript
   // ใน supabase/functions/your-feature-name/index.ts
   const supabaseUrl = Deno.env.get('SUPABASE_URL') || 
     'https://ttfjapfdzrxmbxbarfbn.supabase.co'; // Fallback to cloud
   
   const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
   const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
   
   const supabaseKey = supabaseServiceKey || supabaseAnonKey;
   const supabase = createClient(supabaseUrl, supabaseKey);
   ```

3. **Run function:**
   ```bash
   # Environment variables จะถูกส่งไป Edge Functions อัตโนมัติ
   supabase functions serve your-feature-name --no-verify-jwt
   ```

**✅ ข้อดี:**
- ไม่ต้อง link project
- ยืดหยุ่น (switch ได้ง่าย)
- ทำงานได้ทันที

---

### **วิธีที่ 2: Link Project (Optional - ไม่จำเป็น)**

**❌ คำถาม:** ต้อง `supabase link` เพื่อเห็นข้อมูลจริงไหม?

**✅ คำตอบ:** **ไม่จำเป็น!** ใช้ Environment Variables (วิธีที่ 1) ก็พอ

**ถ้าต้องการใช้ `supabase link`:**
```bash
# Link กับ cloud project (สำหรับ sync config, migrations)
supabase link --project-ref ttfjapfdzrxmbxbarfbn

# Start local
supabase start

# แต่ Edge Functions ยังต้องตั้งค่า env vars เหมือนกัน!
export SUPABASE_URL=https://ttfjapfdzrxmbxbarfbn.supabase.co
supabase functions serve your-function --no-verify-jwt
```

**📌 สรุป:**
- `supabase link` → ใช้สำหรับ sync config/migrations/secrets
- **ไม่จำเป็นสำหรับเห็นข้อมูลจริง** → ใช้ Environment Variables (วิธีที่ 1) ก็พอ ✅

---

## 📝 **ตัวอย่าง Code Pattern**

### **Edge Function ที่ใช้ Cloud Database:**

```typescript
/// <reference path="./deno.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    // ใช้ Cloud Database URL จาก environment
    // ถ้าไม่มีจะใช้ fallback (cloud URL)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 
      'https://ttfjapfdzrxmbxbarfbn.supabase.co';
    
    // Priority: SERVICE_ROLE_KEY > ANON_KEY
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseKey = supabaseServiceKey || supabaseAnonKey;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Your logic here - จะใช้ Cloud Database
    const { data, error } = await supabase
      .from('your_table')
      .select('*')
      .limit(10);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
```

---

## 🔍 **การตรวจสอบว่าใช้ Cloud Database**

```typescript
// Log เพื่อตรวจสอบ
console.log('Using Supabase URL:', Deno.env.get('SUPABASE_URL'));
// ถ้าเป็น https://ttfjapfdzrxmbxbarfbn.supabase.co = Cloud Database ✅
// ถ้าเป็น http://localhost:54321 = Local Database
```

---

## ⚠️ **คำเตือน**

### **⚠️ ระวังการใช้ Cloud Database:**

1. **Data Safety:**
   - การแก้ไข/ลบจะกระทบ **production data**
   - แนะนำให้ใช้ READ-only operations หรือ test branch

2. **Performance:**
   - ช้ากว่า local database (network latency)
   - อาจมี rate limits

3. **Best Practices:**
   - ใช้เฉพาะตอน development
   - อย่าใช้ใน production testing
   - Backup data ก่อน test operations ที่แก้ไขข้อมูล

---

## 🔄 **Switch กลับ Local Database**

```bash
# ลบ environment variables หรือตั้งค่าใหม่
unset SUPABASE_URL
unset SUPABASE_SERVICE_ROLE_KEY

# หรือแก้ไขใน .env.local
SUPABASE_URL=http://localhost:54321  # Local database
```

---

## 📚 **Reference**

- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Environment Variables](https://supabase.com/docs/guides/functions/secrets)

---

**Updated:** 2025-01-27

