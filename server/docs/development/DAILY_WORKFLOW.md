# Daily Development Workflow

## 🎯 **Workflow ทุกครั้งที่เปิดคอม/Editor**

**📌 สถานะปัจจุบัน:**
- ✅ **Production:** ต่อกับ Supabase **Cloud** ทั้ง Database และ Edge Functions
- 🔄 **Local Development:** ถ้าต้องการพัฒนา local → ต้องรันคำสั่งด้านล่าง

**หมายเหตุ:** 
- ถ้าคุณแค่แก้ Frontend หรือทดสอบ → **ไม่ต้องรันอะไร** เพราะ Production ใช้ Cloud อยู่แล้ว! ✅
- **แต่ถ้าต้องการใช้ local Edge Functions** → ต้องแก้ hooks ให้ใช้ `getEdgeFunctionUrl()` helper function ก่อน (ตอนนี้ hooks ยังใช้ Cloud URL โดยตรง)

เมื่อคุณเปิดคอมใหม่หรือเปิดโปรเจคใน editor ครั้งแรก **และต้องการพัฒนา local** คุณต้องรันคำสั่งเหล่านี้:

---

## ✅ **เมื่อไหร่ที่ต้องรัน?**

### **❌ ไม่ต้องรัน:**
- แค่แก้ Frontend code
- ทดสอบแอปใน Production (ใช้ Cloud)
- ไม่แก้ Backend (Edge Functions)

### **✅ ต้องรัน:**
- แก้ Backend (Edge Functions)
- ต้องการพัฒนา local (เห็นผลทันที + hot reload)
- ทดสอบกับ local database

---

## ✅ **Yes - ต้องรันทุกครั้ง (เมื่อพัฒนา local)**

### **1. Start Supabase Infrastructure** 
```bash
supabase start
```
**ทำไม:** Docker containers จะหยุดเมื่อปิดคอม
**ใช้เวลา:** ~30 วินาที - 1 นาที
**Output:** จะแสดง URLs (API, Functions, Studio)

**✅ ตรวจสอบว่า start สำเร็จ:**
```bash
supabase status
# ควรแสดง "Running" สำหรับทุก services
```

---

### **2. Serve Edge Function ที่กำลังพัฒนา**
```bash
# Terminal แยก: เลือก function ที่กำลังแก้ไข
supabase functions serve core-leads-leads-list --no-verify-jwt

# หรือถ้าพัฒนาหลาย functions:
# Terminal 2: supabase functions serve core-leads-lead-management --no-verify-jwt
# Terminal 3: supabase functions serve additional-customer-customer-services --no-verify-jwt
```
**ทำไม:** Edge Functions ไม่ได้รันอัตโนมัติ - ต้อง serve แยกเพื่อ hot reload
**ใช้เวลา:** เริ่มต้นเร็ว (~1-2 วินาที)

---

### **3. Run Frontend**
```bash
npm run dev
```
**ทำไม:** รัน React/Vite development server
**ใช้เวลา:** ~10-30 วินาที (ครั้งแรก)

---

## 📝 **Complete Workflow (ทุกวัน)**

```bash
# Terminal 1: Infrastructure (ครั้งแรก - เปิดทิ้งไว้)
supabase start

# Terminal 2: Edge Function ที่กำลังพัฒนา
supabase functions serve your-function-name --no-verify-jwt

# Terminal 3: Frontend
npm run dev
```

**📌 หมายเหตุ:**
- `supabase start` → เปิดทิ้งไว้ (ไม่ต้องปิด)
- `supabase functions serve` → เปิดทิ้งไว้ตอนพัฒนา
- `npm run dev` → เปิดทิ้งไว้ตอนพัฒนา

---

## 💡 **Tips: ทำให้เร็วขึ้น**

### **Option 1: สร้าง Script**
```bash
# package.json
{
  "scripts": {
    "dev:all": "concurrently \"supabase start\" \"npm run dev\"",
    "dev:function": "supabase functions serve core-leads-leads-list --no-verify-jwt"
  }
}
```

### **Option 2: ใช้ Docker Desktop**
- Docker Desktop อาจรัน `supabase start` อัตโนมัติ (ถ้าเคยรันไว้)
- ตรวจสอบ: `docker ps` หรือ `supabase status`

### **Option 3: Keep Running**
- ไม่ต้อง `supabase stop` ทุกครั้ง - เปิดทิ้งไว้
- ประหยัดเวลา startup

---

## 🔄 **เมื่อปิดคอม**

### **Docker Containers:**
- ⚠️ **หยุดอัตโนมัติ** เมื่อ shutdown (ถ้า Docker Desktop ไม่รัน)
- ✅ **ยังรันอยู่** ถ้า Docker Desktop ยังเปิดอยู่

### **Edge Functions:**
- ❌ **หยุดทันที** - ต้องรันใหม่ทุกครั้ง

### **Frontend:**
- ❌ **หยุดทันที** - ต้องรันใหม่ทุกครั้ง

---

## ✅ **Checklist ทุกครั้ง**

- [ ] Start Supabase: `supabase start`
- [ ] ตรวจสอบ status: `supabase status` (optional)
- [ ] Serve Edge Function: `supabase functions serve [name]`
- [ ] Run Frontend: `npm run dev`
- [ ] ทดสอบ: เปิด browser → ตรวจสอบว่าใช้งานได้

---

## 🎯 **Quick Start Script**

สร้างไฟล์ `dev.sh`:
```bash
#!/bin/bash

echo "🚀 Starting development environment..."

# Start Supabase
echo "📦 Starting Supabase..."
supabase start

# Serve Edge Function (แก้ function name ตามที่ต้องการ)
echo "⚡ Serving Edge Function..."
supabase functions serve core-leads-leads-list --no-verify-jwt &

# Run Frontend
echo "🎨 Starting Frontend..."
npm run dev
```

**Usage:**
```bash
chmod +x dev.sh
./dev.sh
```

---

## 📚 **Related Documents**

- `FRONTEND_BACKEND_DEVELOPMENT.md` - Workflow การพัฒนา Frontend + Backend
- `WHY_FUNCTIONS_SERVE.md` - ทำไมต้องรัน functions serve แยก

---

**Updated:** 2025-01-27

