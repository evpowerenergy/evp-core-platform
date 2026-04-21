# Endpoint Path Clarification

## สรุปความแตกต่างระหว่าง `/additional/...` และ `/system/...`

### Task 30: sale-follow-up

**ไฟล์ที่ Frontend ใช้จริง:**
- ✅ **`/api/endpoints/system/follow-up/sale-follow-up.ts`** (476 lines)
  - **ใช้ใน:** `src/hooks/useSaleFollowUpAPI.ts` (หลาย hooks)
  - **Complexity:** ซับซ้อนกว่า - มี phone normalization, lead matching logic
  - **Features:**
    - GET `action=list`: Query `customer_services_extended` + join with `leads` (phone matching)
    - มี `normalizePhoneNumber` function
    - มี `assigned_sales_person` join
    - Filter: search, province, sale, followUpStatus, assignedTo
    - POST `action=updateCustomer`: Update customer data

**ไฟล์ที่ migrate แล้ว (แต่ Frontend ไม่ใช้):**
- ⚠️ `/api/endpoints/additional/follow-up/sale-follow-up.ts` (203 lines)
  - **ไม่ถูกใช้ใน Frontend**
  - **Complexity:** ง่ายกว่า - basic version
  - **Features:**
    - GET `action=completed-service-customers`: Query `customer_services_with_days` only
    - ไม่มี lead matching
    - Filter: province, sale, installer_name (simple JSON)

**คำแนะนำ:**
- ❌ **ไม่ควร migrate `/additional/...`** - Frontend ไม่ใช้
- ✅ **ควร migrate `/system/follow-up/sale-follow-up.ts` แทน** - นี่คือตัวที่ Frontend ใช้จริง

---

### Task 31: productivity-logs

**ไฟล์ที่ Frontend ใช้จริง:**
- ✅ **`/api/endpoints/system/productivity/productivity-log-submission.ts`** (252 lines)
  - **ใช้ใน:** `src/hooks/useProductivityLogSubmissionAPI.ts`
  - **Complexity:** ซับซ้อนกว่า - ทำหลาย operations พร้อมกัน
  - **Features:**
    - POST only: `create` action
    - ทำ 4 operations:
      1. Create productivity log
      2. Update lead operation_status
      3. Create engineer appointment (ถ้ามี)
      4. Create lead_products (ถ้ามี)

**ไฟล์ที่ migrate แล้ว (แต่ Frontend ไม่ใช้):**
- ⚠️ `/api/endpoints/additional/productivity/productivity-logs.ts` (206 lines)
  - **ไม่ถูกใช้ใน Frontend**
  - **Complexity:** ง่ายกว่า - CRUD operations only
  - **Features:**
    - GET: leadId (get logs), logId (get single log)
    - POST: create, update, delete
    - เพียงแค่จัดการ productivity log เท่านั้น

**คำแนะนำ:**
- ❌ **ไม่ควร migrate `/additional/...`** - Frontend ไม่ใช้
- ✅ **ควร migrate `/system/productivity/productivity-log-submission.ts` แทน** - นี่คือตัวที่ Frontend ใช้จริง

---

## สรุป

1. **Task 30 (sale-follow-up):** 
   - ❌ `/additional/follow-up/sale-follow-up.ts` - migrate แล้ว แต่ Frontend ไม่ใช้
   - ✅ `/system/follow-up/sale-follow-up.ts` - **ต้อง migrate ตัวนี้แทน** (Frontend ใช้จริง)

2. **Task 31 (productivity-logs):**
   - ❌ `/additional/productivity/productivity-logs.ts` - migrate แล้ว แต่ Frontend ไม่ใช้
   - ✅ `/system/productivity/productivity-log-submission.ts` - **ต้อง migrate ตัวนี้แทน** (Frontend ใช้จริง)

**Path ที่ถูกต้อง:**
- ✅ `/api/endpoints/system/follow-up/sale-follow-up.ts` → migrate ตัวนี้
- ✅ `/api/endpoints/system/productivity/productivity-log-submission.ts` → migrate ตัวนี้

