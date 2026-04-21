# Supabase Local: Database Connection

## 🎯 **คำถามที่พบบ่อย**

> "`supabase start` ต่อกับ Cloud Database เลยไหม?"

---

## 📌 **คำตอบ**

### **`supabase start` ทำอะไร?**

**Database:**
- ✅ รัน **Local PostgreSQL** ใน Docker container
- ✅ ใช้ **Local Database** โดย default
- ❌ **ไม่ต่อกับ Cloud Database** โดยอัตโนมัติ

**Edge Functions:**
- ✅ รัน Edge Runtime (deploy mode)
- ⚠️ Edge Functions **สามารถตั้งค่า** ให้ใช้ Cloud Database ได้ (ผ่าน environment variables)

---

## 🔄 **Database Connection ใน Local Development**

### **1. Local Database (Default)**
```bash
supabase start

# Database: Local PostgreSQL (Docker)
# URL: postgresql://postgres:postgres@localhost:54322/postgres
# Data: อยู่บนเครื่อง (isolated)
```

**✅ ข้อดี:**
- ปลอดภัย (ไม่กระทบ production)
- เร็ว (อยู่ในเครื่อง)
- ควบคุมได้ (reset/seed ได้ง่าย)

**⚠️ ข้อเสีย:**
- ต้อง seed/migrate data เอง
- ไม่เห็นข้อมูลจริง

---

### **2. Edge Functions ใช้ Cloud Database**

แม้ว่า `supabase start` จะใช้ Local Database แต่ **Edge Functions สามารถใช้ Cloud Database** ได้:

```bash
# ตั้งค่า environment variables
export SUPABASE_URL=https://ttfjapfdzrxmbxbarfbn.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_key

# Serve Edge Function (จะใช้ Cloud Database)
supabase functions serve your-function --no-verify-jwt
```

**ใน Edge Function:**
```typescript
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 
  'https://ttfjapfdzrxmbxbarfbn.supabase.co'; // Cloud URL

const supabase = createClient(supabaseUrl, supabaseKey);
// → ใช้ Cloud Database ✅
```

**✅ ผลลัพธ์:**
- Local Supabase infrastructure (PostgreSQL, PostgREST, etc.)
- Edge Functions → ใช้ **Cloud Database** (เห็นข้อมูลจริง)
- Best of both worlds! ✅

---

## 🎯 **สรุป**

| Component | Connection | Data Source |
|-----------|------------|-------------|
| **Supabase Infrastructure** (`supabase start`) | Local | Local PostgreSQL (Docker) |
| **Edge Functions** (ถ้าตั้งค่า env vars) | Cloud | Cloud Database ✅ |
| **Frontend** | Cloud (default) | Cloud Database ✅ |

**📌 สิ่งสำคัญ:**
- `supabase start` → Infrastructure = Local
- Edge Functions → Database = Cloud (ถ้าตั้งค่า) หรือ Local (default)
- Frontend → Database = Cloud (always)

---

## 💡 **Recommendation**

### **สำหรับเห็นข้อมูลจริง: วิธีที่ง่ายที่สุด** ⭐

**❌ คำถาม:** Edge Functions ที่รัน local ต่อกับ Cloud Database ไหม?

**✅ คำตอบ:** **ไม่ต่อ!** ต้องตั้งค่า Environment Variables ก่อน

**📌 สถานะปัจจุบัน:**
- Edge Functions ใช้ `Deno.env.get('SUPABASE_URL')`
- **ถ้าไม่ตั้งค่า env vars → จะ error** (เพราะไม่มี fallback)
- **ต้องตั้งค่า env vars เพื่อให้ต่อกับ Cloud Database** ✅

**✅ วิธีที่ 1: Environment Variables (แนะนำที่สุด)**
```bash
# 1. Start local infrastructure
supabase start

# 2. ⚠️ สำคัญ: ตั้งค่า environment variables (เพื่อให้ Edge Functions ใช้ Cloud Database)
export SUPABASE_URL=https://ttfjapfdzrxmbxbarfbn.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_key

# 3. Serve Edge Functions (ตอนนี้จะใช้ Cloud Database ✅)
supabase functions serve your-function --no-verify-jwt
# → Edge Functions จะใช้ Cloud Database ✅ เห็นข้อมูลจริง!
```

**วิธีที่ 2: Link Project (Optional - ไม่จำเป็น)**
```bash
# Link project (สำหรับ sync config, migrations)
supabase link --project-ref ttfjapfdzrxmbxbarfbn

# Start local
supabase start

# แต่ Edge Functions ยังต้องตั้งค่า env vars เหมือนกัน
export SUPABASE_URL=https://ttfjapfdzrxmbxbarfbn.supabase.co
supabase functions serve your-function --no-verify-jwt
```

**📌 สรุป:**
- `supabase link` → ใช้สำหรับ sync config/migrations (ไม่จำเป็นสำหรับเห็นข้อมูลจริง)
- **เห็นข้อมูลจริง** → ตั้งค่า `SUPABASE_URL` environment variable ก็พอ ✅

---

**Updated:** 2025-01-27

