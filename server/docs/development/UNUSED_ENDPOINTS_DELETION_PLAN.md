# แผนการลบ API Endpoints ที่ไม่ได้ใช้

**วันที่สร้างแผน:** 2025-01-27  
**จำนวน Endpoints ที่ต้องลบ:** 8 endpoints  
**สถานะ:** 📋 Ready for Execution

---

## 📋 รายการ Endpoints ที่ต้องลบ

### Core APIs (Priority 1) - 4 endpoints
1. ❌ `/api/endpoints/core/leads/leads.ts` - Legacy/Unused
2. ❌ `/api/endpoints/core/leads/leads-complete.ts` - Legacy/Unused (มี register ใน vite-plugin-api.ts)
3. ❌ `/api/endpoints/core/leads/leads-optimized.ts` - Experimental/Unused (มี page + hook)
4. ❌ `/api/endpoints/core/customer-services/customer-detail.ts` - Legacy/Prepared (ไม่ได้ใช้ใน Frontend)

### Additional APIs (Priority 2) - 3 endpoints
5. ❌ `/api/endpoints/additional/auth/auth.ts` - Migrated แต่ Frontend ใช้ Supabase client โดยตรง
6. ❌ `/api/endpoints/additional/follow-up/sale-follow-up.ts` - Frontend ใช้ `/system/follow-up/sale-follow-up.ts` แทน
7. ❌ `/api/endpoints/additional/productivity/productivity-logs.ts` - Frontend ใช้ `/system/productivity/productivity-log-submission.ts` แทน

### System APIs (Priority 3) - 1 endpoint
8. ❌ `/api/endpoints/system/openai-usage.ts` - Migrated แต่ Frontend ไม่ใช้โดยตรง (legacy)

---

## 🎯 แผนการลบ (Phased Approach)

### **Phase 1: ตรวจสอบและ Backup (Safety First)** ✅
**วัตถุประสงค์:** ตรวจสอบ dependencies และ backup ก่อนลบ

1. ✅ ตรวจสอบว่าไม่มี Frontend code ที่ใช้ endpoints เหล่านี้
2. ✅ ตรวจสอบ Edge Functions ที่ deploy แล้ว (ต้อง undeploy จาก Supabase)
3. ✅ สร้าง branch ใหม่: `cleanup/unused-endpoints`
4. ✅ Backup documentation

---

### **Phase 2: ลบ Core APIs ที่ปลอดภัย (Low Risk)** 🟢
**ลำดับ:** เริ่มจากอันที่ไม่มี dependencies มากที่สุด

#### **2.1 ลบ `/api/endpoints/core/leads/leads.ts`** (ไม่มี register)
- **Files to Delete:**
  - `api/endpoints/core/leads/leads.ts`
  - `supabase/functions/core-leads-leads/` (directory ทั้งหมด)
- **Files to Update:**
  - `api/endpoints/core/index.ts` - ลบ `export { default as leads } from './leads/leads';` (line 8)
  - `api/endpoints/core/leads/index.ts` - ลบ `export { default as leads } from './leads';` (line 4)
- **Edge Function:**
  - ⚠️ **Undeploy จาก Supabase Production:** `supabase functions delete core-leads-leads`
  - **หมายเหตุ:** Function ยัง deploy อยู่บน Supabase (ตรวจสอบได้ด้วย `supabase functions list`)
  - **คำแนะนำ:** Undeploy หลังลบ local files แล้ว เพื่อป้องกัน broken references
- **Risk Level:** 🟢 ต่ำมาก (ไม่มี register, ไม่มี Frontend ใช้)

#### **2.2 ลบ `/api/endpoints/core/customer-services/customer-detail.ts`**
- **Files to Delete:**
  - `api/endpoints/core/customer-services/customer-detail.ts`
  - `supabase/functions/core-customer-services-customer-detail/` (directory ทั้งหมด)
- **Files to Update:**
  - `api/endpoints/core/index.ts` - ลบ `export { default as customerDetail } from './customer-services/customer-detail';` (line 4)
  - `api/endpoints/core/customer/index.ts` - ลบ `export { default as customerDetail } from './customer-detail';` (line 2)
- **Edge Function:**
  - ⚠️ **Undeploy จาก Supabase Production:** `supabase functions delete core-customer-services-customer-detail`
  - **หมายเหตุ:** Function ยัง deploy อยู่บน Supabase (ตรวจสอบได้ด้วย `supabase functions list`)
  - **คำแนะนำ:** Undeploy หลังลบ local files แล้ว เพื่อป้องกัน broken references
- **Risk Level:** 🟢 ต่ำมาก (ไม่ได้ใช้ใน Frontend)

---

### **Phase 3: ลบ Core APIs ที่มี Register (Medium Risk)** 🟡
**ต้องลบ registrations ใน vite-plugin-api.ts**

#### **3.1 ลบ `/api/endpoints/core/leads/leads-complete.ts`**
- **Files to Delete:**
  - `api/endpoints/core/leads/leads-complete.ts`
  - `supabase/functions/core-leads-leads-complete/` (directory ทั้งหมด)
- **Files to Update:**
  - `api/endpoints/core/index.ts` - ลบ `export { default as leadsComplete } from './leads/leads-complete';` (line 15)
  - `api/endpoints/core/leads/index.ts` - ลบ `export { default as leadsComplete } from './leads-complete';` (line 8)
  - `vite-plugin-api.ts` - ลบ block (lines 603-634):
    ```typescript
    // Handle leads-complete endpoint (GET and POST)
    else if (req.url?.startsWith('/api/endpoints/core/leads/leads-complete')) {
      // ... entire block
    }
    ```
- **Edge Function:**
  - ⚠️ **Undeploy จาก Supabase Production:** `supabase functions delete core-leads-leads-complete`
  - **หมายเหตุ:** Function ยัง deploy อยู่บน Supabase (ตรวจสอบได้ด้วย `supabase functions list`)
  - **คำแนะนำ:** Undeploy หลังลบ local files แล้ว เพื่อป้องกัน broken references
- **Risk Level:** 🟡 ปานกลาง (มี register แต่ไม่มี Frontend ใช้)

---

### **Phase 4: ลบ leads-optimized (High Risk - มี Page + Hook)** 🔴
**⚠️ ต้องตัดสินใจ: ลบ page ด้วยหรือเก็บไว้?**

#### **Option A: ลบทั้งหมด (Recommended)**
- **Files to Delete:**
  - `api/endpoints/core/leads/leads-optimized.ts`
  - `supabase/functions/core-leads-leads-optimized/` (directory ทั้งหมด)
  - `src/pages/LeadAddOptimized.tsx` (page)
  - `src/hooks/useLeadsOptimizedAPI.ts` (hook - แต่ต้องเช็คก่อนว่ามีที่อื่นใช้ไหม)
- **Files to Update:**
  - `api/endpoints/core/index.ts` - ลบ `export { default as leadsOptimized } from './leads/leads-optimized';` (line 9)
  - `api/endpoints/core/leads/index.ts` - ลบ `export { default as leadsOptimized } from './leads-optimized';` (line 5)
  - `vite-plugin-api.ts` - ลบ block (lines 933-945):
    ```typescript
    // Handle leads optimized endpoint
    else if (req.url?.startsWith('/api/endpoints/core/leads/leads-optimized') && req.method === 'GET') {
      // ... entire block
    }
    ```
  - `src/App.tsx` - ลบ route `/leads/add-optimized` (lines 220-224)
  - `src/App.tsx` - ลบ import `LeadAddOptimized` (line 28)
- **Edge Function:**
  - Undeploy: `supabase functions delete core-leads-leads-optimized`
- **Risk Level:** 🔴 สูง (มี page + hook แต่ไม่มี menu link)

#### **Option B: เก็บ Page ไว้ แต่ลบ Endpoint**
- เก็บ `LeadAddOptimized.tsx` ไว้
- ปรับให้ใช้ endpoint อื่นแทน (เช่น `core-leads-leads-list`)

**คำแนะนำ:** ลบทั้งหมด (Option A) เพราะไม่มี menu link และไม่มีใครใช้งาน

---

### **Phase 5: ลบ Additional APIs (Low-Medium Risk)** 🟡

#### **5.1 ลบ `/api/endpoints/additional/auth/auth.ts`**
- **Files to Delete:**
  - `api/endpoints/additional/auth/auth.ts`
  - `supabase/functions/additional-auth-auth/` (directory ทั้งหมด)
- **Files to Update:**
  - `api/endpoints/additional/auth/index.ts` (ถ้ามี) - ลบ export
- **Edge Function:**
  - Undeploy: `supabase functions delete additional-auth-auth`
- **Risk Level:** 🟢 ต่ำ (Frontend ใช้ Supabase client โดยตรง)

#### **5.2 ลบ `/api/endpoints/additional/follow-up/sale-follow-up.ts`**
- **Files to Delete:**
  - `api/endpoints/additional/follow-up/sale-follow-up.ts`
  - `supabase/functions/additional-follow-up-sale-follow-up/` (directory ทั้งหมด)
- **Files to Update:**
  - `api/endpoints/additional/follow-up/index.ts` (ถ้ามี) - ลบ export
- **Edge Function:**
  - Undeploy: `supabase functions delete additional-follow-up-sale-follow-up`
- **Risk Level:** 🟢 ต่ำ (Frontend ใช้ `/system/follow-up/sale-follow-up.ts` แทน)

#### **5.3 ลบ `/api/endpoints/additional/productivity/productivity-logs.ts`**
- **Files to Delete:**
  - `api/endpoints/additional/productivity/productivity-logs.ts`
  - `supabase/functions/additional-productivity-productivity-logs/` (directory ทั้งหมด)
- **Files to Update:**
  - `api/endpoints/additional/productivity/index.ts` (ถ้ามี) - ลบ export
- **Edge Function:**
  - Undeploy: `supabase functions delete additional-productivity-productivity-logs`
- **Risk Level:** 🟢 ต่ำ (Frontend ใช้ `/system/productivity/productivity-log-submission.ts` แทน)

---

### **Phase 6: ลบ System APIs (Low Risk)** 🟢

#### **6.1 ลบ `/api/endpoints/system/openai-usage.ts`**
- **Files to Delete:**
  - `api/endpoints/system/openai-usage.ts`
  - `supabase/functions/system-openai-usage/` (directory ทั้งหมด)
  - `supabase/functions/openai-usage/` (directory ทั้งหมด - ถ้ามี)
- **Files to Update:**
  - `api/endpoints/system/index.ts` (ถ้ามี) - ลบ export
  - `vite-plugin-api.ts` - ลบ block `/api/openai-usage` (lines 122-123) ถ้ามี
- **Edge Function:**
  - Undeploy: `supabase functions delete system-openai-usage`
  - Undeploy: `supabase functions delete openai-usage` (ถ้ามี)
- **Risk Level:** 🟢 ต่ำ (Frontend ไม่ใช้โดยตรง)

---

### **Phase 7: อัพเดท Documentation** 📝

#### **7.1 อัพเดท `api/README.md`**
- ลบ endpoints ที่ลบแล้วออกจากรายการ
- อัพเดท status

#### **7.2 อัพเดท `EDGE_MIGRATION_PLAN.md`**
- เพิ่ม section "Deleted Endpoints"
- ระบุเหตุผลการลบ

#### **7.3 อัพเดท `ENDPOINT_USAGE_ANALYSIS.md`**
- Mark endpoints ที่ลบแล้วเป็น `[DELETED]`

#### **7.4 อัพเดท OpenAPI Spec**
- ลบ paths ที่ลบแล้วจาก `api/docs/openapi/openapi.json`
- Run: `npm run gen:openapi` (ถ้ามี script)

---

## ✅ Checklist ก่อนเริ่มลบ

- [ ] สร้าง branch ใหม่: `git checkout -b cleanup/unused-endpoints`
- [ ] ทดสอบว่าแอปยังทำงานปกติก่อนลบ
- [ ] Backup Edge Functions (ถ้าต้องการ)
- [ ] ตรวจสอบ dependencies ทั้งหมด
- [ ] แจ้งทีมก่อนลบ (ถ้ามี)

---

## 🚀 Execution Order (Recommended)

### **Day 1: Low Risk (Phase 2)**
1. ✅ ลบ `leads.ts`
2. ✅ ลบ `customer-detail.ts`
3. ✅ ทดสอบ

### **Day 2: Medium Risk (Phase 3)**
4. ✅ ลบ `leads-complete.ts`
5. ✅ ทดสอบ

### **Day 3: High Risk (Phase 4)**
6. ✅ ลบ `leads-optimized.ts` + Page + Hook
7. ✅ ทดสอบ

### **Day 4: Additional APIs (Phase 5)**
8. ✅ ลบ `auth/auth.ts`
9. ✅ ลบ `additional/follow-up/sale-follow-up.ts`
10. ✅ ลบ `additional/productivity/productivity-logs.ts`
11. ✅ ทดสอบ

### **Day 5: System APIs + Documentation (Phase 6-7)**
12. ✅ ลบ `system/openai-usage.ts`
13. ✅ **Undeploy Edge Functions จาก Supabase Production** (ทำทีเดียวทั้งหมด)
14. ✅ อัพเดท Documentation
15. ✅ Final Testing
16. ✅ Create PR

---

### **Phase 8: Undeploy Edge Functions จาก Supabase Production** 🚀
**ทำหลังจากลบ local files ทั้งหมดแล้ว**

⚠️ **สำคัญ:** Edge Functions ที่ลบ local files แล้ว ยัง deploy อยู่บน Supabase Production ต้อง undeploy

**Commands:**
```bash
# Undeploy Edge Functions ที่ลบแล้ว (3 endpoints จาก Phase 2-3)
supabase functions delete core-leads-leads
supabase functions delete core-customer-services-customer-detail
supabase functions delete core-leads-leads-complete

# ตรวจสอบว่า undeploy สำเร็จ
supabase functions list | grep -E "core-leads-leads$|core-customer-services-customer-detail|core-leads-leads-complete"
```

**Note:** 
- Undeploy ทำทีเดียวหลังจากลบ local files ทั้งหมดเสร็จแล้ว
- หรือทำตาม phase แต่ละ phase หลังจากลบ local files แล้ว (แนะนำ)
- ตรวจสอบสถานะด้วย `supabase functions list`

---

## ⚠️ คำเตือน

1. **อย่าลบหลาย endpoints พร้อมกัน** - ทำทีละอันและทดสอบ
2. **ตรวจสอบ Git history** - เก็บ reference ไว้ใน case ที่ต้อง rollback
3. **Undeploy Edge Functions ก่อนลบ code** - ป้องกัน broken references
4. **Test thoroughly** - ตรวจสอบทุก page ที่เกี่ยวข้อง

---

## 📊 Expected Results

หลังลบเสร็จ:
- **ไฟล์ที่ลบ:** ~8 API endpoint files + ~8 Edge Function directories
- **Code ลดลง:** ~3,000-5,000 lines (ประมาณ)
- **Maintenance ลดลง:** ไม่ต้อง maintain endpoints ที่ไม่ได้ใช้
- **Clarity เพิ่มขึ้น:** โค้ดเบสสะอาดขึ้น

---

## 🔄 Rollback Plan

ถ้าต้อง rollback:
1. `git revert <commit-hash>`
2. Deploy Edge Functions กลับมา (ถ้า backup ไว้)
3. Restore files จาก Git history

---

**สร้างโดย:** Auto (AI Assistant)  
**วันที่:** 2025-01-27  
**สถานะ:** 📋 Ready for Review

