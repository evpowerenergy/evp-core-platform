# Hook Migration Strategy: แก้ Hooks เพื่อ Auto-Switch

## 🎯 **Overview**

เอกสารนี้อธิบายว่า **ต้องแก้ hooks ทั้งหมดหรือไม่** และ **strategy** ในการแก้ไข

---

## ❓ **คำถาม: ต้องแก้ hooks ทั้งหมดไหม?**

### **คำตอบ: ไม่จำเป็นต้องแก้ทั้งหมด!**

**มี 2 ทางเลือก:**

### **Option 1: แก้เฉพาะ Hook ที่กำลังพัฒนา (แนะนำ)** ⭐

**เมื่อไหร่:**
- กำลังพัฒนา/แก้ไข Backend specific function
- ไม่ต้องการแก้ hooks ทั้งหมดตอนนี้

**วิธี:**
- แก้เฉพาะ hook ที่เรียก function ที่กำลังพัฒนา
- ใช้ `getEdgeFunctionUrl()` helper function

**ตัวอย่าง:**
```typescript
// กำลังแก้ supabase/functions/core-leads-leads-list/index.ts
// → แก้แค่ useLeadsAPI.ts ที่เรียก function นี้

import { getEdgeFunctionUrlWithParams } from '@/utils/edgeFunctionUrl';

// แทนที่
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '...';
const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/core-leads-leads-list`;

// ด้วย
const edgeFunctionUrl = getEdgeFunctionUrlWithParams('core-leads-leads-list', {
  category: category || undefined
});
```

**ข้อดี:**
- ✅ ทำเร็ว (แก้เฉพาะที่ต้องการ)
- ✅ ไม่กระทบ hooks อื่นๆ
- ✅ แก้เป็นระยะๆ ตามที่พัฒนา

**ข้อเสีย:**
- ⚠️ ต้องจำไว้ว่า hook ไหนแก้แล้ว
- ⚠️ Hooks อื่นๆ ยังต้อง deploy

---

### **Option 2: แก้ Hooks ทั้งหมด (แนะนำสำหรับ Long-term)** 🔄

**เมื่อไหร่:**
- ต้องการความสะดวกในอนาคต
- ต้องการ auto-switch ทุก function

**วิธี:**
- แก้ hooks ทั้งหมดที่ใช้ `${SUPABASE_URL}/functions/v1/...`
- ใช้ `getEdgeFunctionUrl()` helper function

**ข้อดี:**
- ✅ Auto-switch ทุก function
- ✅ สะดวกในอนาคต (ไม่ต้อง deploy ทุกครั้ง)
- ✅ Development experience ดีขึ้น

**ข้อเสีย:**
- ⏱️ ใช้เวลา (78 files)
- ⚠️ ต้องทดสอบทุก hook ว่ายังทำงานปกติ

---

## 📊 **จำนวน Hooks ที่ต้องแก้**

### **Hooks ที่ใช้ Cloud URL โดยตรง:**
- ประมาณ **78 files** ใน `src/hooks/`
- Hooks ที่ต้องแก้: ทุกไฟล์ที่ใช้ pattern:
  ```typescript
  `${SUPABASE_URL}/functions/v1/...`
  ```

### **Hooks ที่ใช้ Helper Function แล้ว:**
- **2 files** (edgeFunctionUrl.ts และ files ที่ import มา)

---

## 💡 **แนะนำ: Hybrid Approach**

### **Phase 1: แก้เฉพาะ Hook ที่กำลังพัฒนา (ตอนนี้)**
- แก้ hook ที่เรียก function ที่กำลังพัฒนา
- ตัวอย่าง: แก้ `core-leads-leads-list` → แก้ `useLeadsAPI.ts`

### **Phase 2: แก้เป็นระยะๆ (ต่อมา)**
- เมื่อพัฒนา function ใหม่ → แก้ hook ที่เกี่ยวข้อง
- ค่อยๆ migrate ไปทีละ function

### **Phase 3: แก้ทั้งหมด (ถ้าต้องการ)**
- เมื่อมีเวลา → แก้ hooks ที่เหลือทั้งหมด
- หรือแก้เป็น batch ตาม category

---

## 🔧 **Pattern สำหรับการแก้ไข**

### **ก่อนแก้:**
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/function-name`;
```

### **หลังแก้ (Simple URL):**
```typescript
import { getEdgeFunctionUrl } from '@/utils/edgeFunctionUrl';

const edgeFunctionUrl = getEdgeFunctionUrl('function-name');
```

### **หลังแก้ (With Params):**
```typescript
import { getEdgeFunctionUrlWithParams } from '@/utils/edgeFunctionUrl';

const edgeFunctionUrl = getEdgeFunctionUrlWithParams('function-name', {
  param1: value1,
  param2: value2
});
```

---

## 📝 **Checklist สำหรับการแก้ไข**

### **สำหรับ Option 1 (แก้เฉพาะที่พัฒนา):**
- [ ] ระบุ function ที่กำลังพัฒนา
- [ ] หา hooks ที่เรียก function นั้น
- [ ] แก้ hooks ที่เกี่ยวข้อง
- [ ] ทดสอบว่ายังทำงานปกติ

### **สำหรับ Option 2 (แก้ทั้งหมด):**
- [ ] สร้าง list ของ hooks ทั้งหมดที่ต้องแก้
- [ ] แก้ทีละ hook (หรือ batch)
- [ ] ทดสอบแต่ละ hook ว่ายังทำงานปกติ
- [ ] Update documentation

---

## 🎯 **สรุปคำตอบ**

### **❓ ต้องแก้ hooks ทุกไฟล์ไหม?**
**ไม่จำเป็น!** แก้เฉพาะ hook ที่เรียก function ที่กำลังพัฒนา

### **❓ ตอนนี้ต้อง deploy Backend ก่อนเห็นผลใช่ไหม?**
**ใช่!** เพราะ hooks ใช้ Cloud URL โดยตรง → ต้อง deploy ก่อน

### **❓ ถ้าแก้ hooks → ไม่ต้อง deploy?**
**ใช่!** ถ้าแก้ hooks ให้ใช้ helper function → รัน `supabase functions serve` → เห็นผลทันที

---

## 📚 **Related**

- `FRONTEND_BACKEND_DEVELOPMENT.md` - Workflow การพัฒนา
- `AUTO_SWITCH_LOCAL_CLOUD.md` - Auto-switch mechanism

---

**Updated:** 2025-01-27

