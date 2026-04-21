# API Endpoint Usage Analysis for Edge Migration

**วันที่ตรวจสอบ:** 2025-10-31  
**วันที่อัพเดท:** 2025-01-27 (เพิ่มข้อมูล endpoints ที่ถูกลบแล้ว)  
**เป้าหมาย:** ระบุ API endpoints ที่ถูกใช้จริงในโค้ด เพื่อหลีกเลี่ยงการ migrate endpoints ที่ไม่ได้ใช้

---

## 📊 สรุปผลการตรวจสอบ

### ✅ **Endpoints ที่ใช้จริง (ควร migrate)**

**Core APIs (Priority 1):**
1. ✅ `/api/endpoints/core/leads/lead-management` - **ใช้จริง** (`useAppDataAPI.ts`) → ✅ **Migrated**
2. ✅ `/api/endpoints/core/leads/lead-mutations` - **ใช้จริง** (`useAppDataAPI.ts`, `useLeadsAPI.ts`, `useLeadsOptimizedAPI.ts`) → ✅ **Migrated**
3. ✅ `/api/endpoints/core/leads/leads-list` - **ใช้จริง** (`useLeadsAPI.ts`) → ✅ **Migrated**
4. ✅ `/api/endpoints/core/leads/leads-for-dashboard` - **ใช้จริง** (`Index.tsx`) → ✅ **Migrated**
5. ✅ `/api/endpoints/core/appointments/appointments` - **ใช้จริง** (`useAppointmentsAPI.ts`) → ✅ **Migrated**
6. ✅ `/api/endpoints/additional/products/products` - **ใช้จริง** (`useInventoryDataAPI.ts`) → ✅ **Migrated**
7. ✅ `/api/endpoints/core/leads/lead-detail` - **ใช้จริง** (`useLeadDetailAPI.ts` - 3 hooks) → ✅ **Migrated**
8. ✅ `/api/endpoints/core/leads/phone-validation` - **ใช้จริง** (`src/utils/leadValidation.ts`) → ✅ **Migrated**
9. ✅ `/api/endpoints/core/leads/sales-team-list` - **ใช้จริง** (`useLeadsAPI.ts`) → ✅ **Migrated**
10. ✅ `/api/endpoints/core/my-leads/my-leads` - **ใช้จริง** (`useAppDataAPI.ts` - useMyLeadsWithMutations) → ✅ **Migrated**
11. ✅ `/api/endpoints/core/my-leads/my-leads-data` - **ใช้จริง** (`useAppDataAPI.ts` - useMyLeadsData) → ✅ **Migrated**
12. ✅ `/api/endpoints/core/sales-team/sales-team` - **ใช้จริง** (`LeadDetail.tsx`) → ✅ **Migrated**
13. ✅ `/api/endpoints/core/sales-team/sales-team-data` - **ใช้จริง** (`useAppDataAPI.ts` - useSalesTeamData) → ✅ **Migrated**
14. ✅ `/api/endpoints/core/sales-team/filtered-sales-team` - **ใช้จริง** (`useAppDataAPI.ts` - useFilteredSalesTeamData) → ✅ **Migrated**
15. ❌ `/api/endpoints/core/leads/leads-optimized` - **ไม่ได้ใช้จริง** (`LeadAddOptimized.tsx` ไม่มีใครไป) → ❌ **DELETED (2025-01-27)** - Page/Hook removed, Edge Function undeployed
16. ⚠️ `/api/endpoints/core/inventory/inventory` - **ใช้จริง** (`useInventoryDataAPI.ts`) → ❌ **ยังไม่ได้ migrate**
17. ⚠️ `/api/endpoints/core/inventory/inventory-mutations` - **ใช้จริง** (`useInventoryDataAPI.ts`) → ❌ **ยังไม่ได้ migrate**
18. ⚠️ `/api/endpoints/core/customer-services/customer-detail` - **ใช้จริง** (marked as [OPTIONAL] แต่ควรเช็ค)

**Additional APIs (Priority 2):**
19. ⚠️ `/api/endpoints/additional/auth/auth` - **ใช้จริง** (`useAuthAPI.ts`) → ❌ **ยังไม่ได้ migrate**
20. ⚠️ `/api/endpoints/additional/auth/user-data` - **ใช้จริง** (`useUserDataAPI.ts`) → ❌ **ยังไม่ได้ migrate**
21. ⚠️ `/api/endpoints/additional/inventory/inventory-units` - **ใช้จริง** (`useInventoryDataAPI.ts`) → ❌ **ยังไม่ได้ migrate**
22. ⚠️ `/api/endpoints/additional/purchase-orders/purchase-orders` - **ใช้จริง** (`useInventoryDataAPI.ts`) → ❌ **ยังไม่ได้ migrate**
23. ⚠️ `/api/endpoints/additional/purchase-orders/purchase-order-mutations` - **ใช้จริง** (`useInventoryDataAPI.ts`) → ❌ **ยังไม่ได้ migrate**
24. ⚠️ `/api/endpoints/additional/customer/customer-services` - **ใช้จริง** (`useCustomerServicesAPI.ts`) → ❌ **ยังไม่ได้ migrate**
25. ⚠️ `/api/endpoints/additional/customer/customer-service-stats` - **ใช้จริง** (`useCustomerServicesAPI.ts`) → ❌ **ยังไม่ได้ migrate**
26. ⚠️ `/api/endpoints/additional/customer/customer-service-mutations` - **ใช้จริง** (`useCustomerServicesAPI.ts`) → ❌ **ยังไม่ได้ migrate**
27. ⚠️ `/api/endpoints/additional/customer/customer-service-filters` - **ใช้จริง** (`useCustomerServicesAPI.ts`) → ❌ **ยังไม่ได้ migrate**
28. ⚠️ `/api/endpoints/additional/follow-up/sale-follow-up` - **ใช้จริง** (`useSaleFollowUpAPI.ts`) → ❌ **ยังไม่ได้ migrate**
29. ⚠️ `/api/endpoints/additional/productivity/productivity-logs` - ควรเช็คว่าใช้จริงหรือไม่

**System APIs (Priority 3):**
30. ⚠️ `/api/endpoints/system/openai-sync` - **ใช้จริง** (hook: useOpenAICost) → ❌ **ยังไม่ได้ migrate**
31. ⚠️ `/api/endpoints/system/openai-usage` - **ใช้จริง** (hook: useOpenAICost) → ❌ **ยังไม่ได้ migrate**
32. ⚠️ `/api/endpoints/system/follow-up/sale-follow-up` - **ใช้จริง** (`useSaleFollowUpAPI.ts`) → ❌ **ยังไม่ได้ migrate**
33. ⚠️ `/api/endpoints/system/management/products-management` - **ใช้จริง** (`useProductsAPI.ts`) → ❌ **ยังไม่ได้ migrate**
34. ⚠️ `/api/endpoints/system/management/sales-team-management` - **ใช้จริง** (`useSalesTeamAPI.ts`) → ❌ **ยังไม่ได้ migrate**
35. ⚠️ `/api/endpoints/system/productivity/productivity-log-submission` - **ใช้จริง** (`useProductivityLogSubmissionAPI.ts`) → ❌ **ยังไม่ได้ migrate**
36. ⚠️ `/api/endpoints/system/service/service-appointments` - **ใช้จริง** (`useServiceAppointmentsAPI.ts`) → ❌ **ยังไม่ได้ migrate**
37. ⚠️ `/api/endpoints/system/service/service-visits` - **ใช้จริง** (`useServiceVisitsAPI.ts`) → ❌ **ยังไม่ได้ migrate**

---

### ❌ **Endpoints ที่ไม่ได้ใช้จริง - ถูกลบแล้ว (2025-01-27)**

**Core APIs:**
1. ❌ ~~`/api/endpoints/core/leads/leads`~~ - **DELETED (2025-01-27)**
   - Legacy/Unused endpoint
   - Edge Function undeployed: `core-leads-leads`
   - **รายละเอียด:** ดูที่ `UNUSED_ENDPOINTS_DELETION_PLAN.md`

2. ❌ ~~`/api/endpoints/core/leads/leads-complete`~~ - **DELETED (2025-01-27)**
   - Legacy/Unused endpoint
   - Registration removed from `vite-plugin-api.ts`
   - Edge Function undeployed: `core-leads-leads-complete`
   - **รายละเอียด:** ดูที่ `UNUSED_ENDPOINTS_DELETION_PLAN.md`

3. ❌ ~~`/api/endpoints/core/leads/leads-optimized`~~ - **DELETED (2025-01-27)**
   - Experimental/Unused endpoint
   - Page removed: `LeadAddOptimized.tsx`
   - Hook removed: `useLeadsOptimizedAPI.ts`, `useLeadsOptimized.ts`
   - Route removed: `/leads/add-optimized`
   - Edge Function undeployed: `core-leads-leads-optimized`
   - **รายละเอียด:** ดูที่ `UNUSED_ENDPOINTS_DELETION_PLAN.md`

4. ❌ ~~`/api/endpoints/core/customer-services/customer-detail`~~ - **DELETED (2025-01-27)**
   - Legacy/Prepared endpoint (ไม่ได้ใช้ใน Frontend)
   - Edge Function undeployed: `core-customer-services-customer-detail`
   - **รายละเอียด:** ดูที่ `UNUSED_ENDPOINTS_DELETION_PLAN.md`

**Additional APIs:**
5. ❌ ~~`/api/endpoints/additional/auth/auth`~~ - **DELETED (2025-01-27)**
   - Frontend uses Supabase client directly
   - Edge Function undeployed: `additional-auth-auth`
   - **รายละเอียด:** ดูที่ `UNUSED_ENDPOINTS_DELETION_PLAN.md`

6. ❌ ~~`/api/endpoints/additional/follow-up/sale-follow-up`~~ - **DELETED (2025-01-27)**
   - Frontend uses `/system/follow-up/sale-follow-up` instead
   - Edge Function undeployed: `additional-follow-up-sale-follow-up`
   - **รายละเอียด:** ดูที่ `UNUSED_ENDPOINTS_DELETION_PLAN.md`

7. ❌ ~~`/api/endpoints/additional/productivity/productivity-logs`~~ - **DELETED (2025-01-27)**
   - Frontend uses `/system/productivity/productivity-log-submission` instead
   - Edge Function undeployed: `additional-productivity-productivity-logs`
   - **รายละเอียด:** ดูที่ `UNUSED_ENDPOINTS_DELETION_PLAN.md`

**System APIs:**
8. ❌ ~~`/api/endpoints/system/openai-usage`~~ - **DELETED (2025-01-27)**
   - Legacy endpoint (Frontend doesn't use directly)
   - Edge Functions undeployed: `system-openai-usage`, `openai-usage`
   - **รายละเอียด:** ดูที่ `UNUSED_ENDPOINTS_DELETION_PLAN.md`

**ยังไม่ได้ลบ:**
9. ❌ `/api/endpoints/system/auth/auth` - **ไม่ได้ใช้จริง** (marked as [NOT_USED] in api/README.md)
10. ❌ `/api/endpoints/system/user/user-data` - **ไม่ได้ใช้จริง** (marked as [NOT_USED] in api/README.md, duplicate of additional/auth/user-data)

---

## 📋 รายการ Endpoints จาก EDGE_MIGRATION_PLAN.md

### Core APIs (Priority 1) - 19 endpoints

#### ✅ **Migrated (14 endpoints):**
1. ✅ `/api/endpoints/core/leads/lead-management` → `core-leads-lead-management`
2. ✅ `/api/endpoints/core/leads/lead-mutations` → `core-leads-lead-mutations`
3. ✅ `/api/endpoints/core/leads/leads-list` → `core-leads-leads-list`
4. ✅ `/api/endpoints/core/leads/leads-for-dashboard` → `core-leads-leads-for-dashboard`
5. ✅ `/api/endpoints/core/appointments/appointments` → `core-appointments-appointments`
6. ✅ `/api/endpoints/additional/products/products` → `additional-products-products`
7. ✅ `/api/endpoints/core/leads/lead-detail` → `core-leads-lead-detail`
8. ✅ `/api/endpoints/core/leads/phone-validation` → `core-leads-phone-validation`
9. ✅ `/api/endpoints/core/leads/sales-team-list` → `core-leads-sales-team-list`
10. ✅ `/api/endpoints/core/my-leads/my-leads` → `core-my-leads-my-leads`
11. ✅ `/api/endpoints/core/my-leads/my-leads-data` → `core-my-leads-my-leads-data`
12. ✅ `/api/endpoints/core/sales-team/sales-team` → `core-sales-team-sales-team`
13. ✅ `/api/endpoints/core/sales-team/sales-team-data` → `core-sales-team-sales-team-data`
14. ✅ `/api/endpoints/core/sales-team/filtered-sales-team` → `core-sales-team-filtered-sales-team`

#### ❌ **Not Used - Skip Migration (3 endpoints):**
8. ❌ `/api/endpoints/core/leads/leads` → **SKIP** (ไม่ได้ใช้จริง)
9. ❌ `/api/endpoints/core/leads/leads-complete` → **SKIP** (ไม่ได้ใช้จริง, แต่ migrate ไว้แล้ว)
10. ❌ `/api/endpoints/core/leads/leads-optimized` - **ไม่ได้ใช้จริง**
   - ใช้ใน `LeadAddOptimized.tsx` (Route: `/leads/add-optimized`)
   - แต่ **ไม่มีหน้าหรือ menu item ไหนนำทางไป `/leads/add-optimized`**
   - Sidebar ใช้ `/leads/new` ซึ่งใช้ `LeadAdd` (ใช้ `useLeads` จาก `useLeadsAPI`)
   - Index page ก็ link ไป `/leads/new` ไม่ใช่ `/leads/add-optimized`
   - **สรุป:** `LeadAddOptimized` page เป็น Experimental/Unused page - **SKIP migration** (แม้จะ migrate ไว้แล้ว - เก็บไว้ได้)

#### ⚠️ **Used - Need Migration (8 endpoints):**
11. ⚠️ `/api/endpoints/core/my-leads/my-leads` → **ควร migrate**
14. ⚠️ `/api/endpoints/core/my-leads/my-leads-data` → **ควร migrate**
15. ⚠️ `/api/endpoints/core/sales-team/sales-team` → **ควร migrate**
16. ⚠️ `/api/endpoints/core/sales-team/sales-team-data` → **ควร migrate**
17. ⚠️ `/api/endpoints/core/sales-team/filtered-sales-team` → **ควร migrate**
18. ⚠️ `/api/endpoints/core/inventory/inventory` → **ควร migrate**
19. ⚠️ `/api/endpoints/core/inventory/inventory-mutations` → **ควร migrate**
20. ⚠️ `/api/endpoints/core/customer-services/customer-detail` → **ควรเช็คก่อน migrate** ([OPTIONAL])

### Additional APIs (Priority 2) - 12 endpoints

#### ⚠️ **All Used - Need Migration (12 endpoints):**
1. ⚠️ `/api/endpoints/additional/auth/auth` → **ควร migrate**
2. ⚠️ `/api/endpoints/additional/auth/user-data` → **ควร migrate**
3. ⚠️ `/api/endpoints/additional/inventory/inventory-units` → **ควร migrate**
4. ⚠️ `/api/endpoints/additional/purchase-orders/purchase-orders` → **ควร migrate**
5. ⚠️ `/api/endpoints/additional/purchase-orders/purchase-order-mutations` → **ควร migrate**
6. ⚠️ `/api/endpoints/additional/customer/customer-services` → **ควร migrate**
7. ⚠️ `/api/endpoints/additional/customer/customer-service-stats` → **ควร migrate**
8. ⚠️ `/api/endpoints/additional/customer/customer-service-mutations` → **ควร migrate**
9. ⚠️ `/api/endpoints/additional/customer/customer-service-filters` → **ควร migrate**
10. ⚠️ `/api/endpoints/additional/follow-up/sale-follow-up` → **ควร migrate**
11. ⚠️ `/api/endpoints/additional/productivity/productivity-logs` → **ควรเช็คก่อน migrate**

### System APIs (Priority 3) - 8 endpoints

#### ⚠️ **All Used - Need Migration (8 endpoints):**
1. ⚠️ `/api/endpoints/system/openai-sync` → **ควร migrate**
2. ⚠️ `/api/endpoints/system/openai-usage` → **ควร migrate**
3. ⚠️ `/api/endpoints/system/follow-up/sale-follow-up` → **ควร migrate**
4. ⚠️ `/api/endpoints/system/management/products-management` → **ควร migrate**
5. ⚠️ `/api/endpoints/system/management/sales-team-management` → **ควร migrate**
6. ⚠️ `/api/endpoints/system/productivity/productivity-log-submission` → **ควร migrate**
7. ⚠️ `/api/endpoints/system/service/service-appointments` → **ควร migrate**
8. ⚠️ `/api/endpoints/system/service/service-visits` → **ควร migrate**

---

## 🎯 คำแนะนำการ Migrate

### **ลำดับความสำคัญ:**

**Phase 1: Core APIs ที่ใช้จริง (3 endpoints)**
1. `/api/endpoints/core/inventory/inventory` ← **เริ่มจากนี้**
10. `/api/endpoints/core/inventory/inventory`
11. `/api/endpoints/core/inventory/inventory-mutations`

**Phase 2: Additional APIs (12 endpoints)**
- ตามลำดับใน EDGE_MIGRATION_PLAN.md

**Phase 3: System APIs (8 endpoints)**
- ตามลำดับใน EDGE_MIGRATION_PLAN.md

### **Endpoints ที่ควร SKIP:**

❌ **ไม่ต้อง migrate:**
- `/api/endpoints/core/leads/leads` - Legacy/Unused
- `/api/endpoints/core/leads/leads-complete` - Legacy/Unused (แต่ migrate ไว้แล้ว - ควรลบหรือ keep ไว้)
- `/api/endpoints/core/leads/leads-optimized` - Experimental/Unused (แต่ migrate ไว้แล้ว - ควรลบหรือ keep ไว้)
- `/api/endpoints/system/auth/auth` - [NOT_USED]
- `/api/endpoints/system/user/user-data` - [NOT_USED], duplicate

---

## 📝 สรุป

**Total Endpoints in EDGE_MIGRATION_PLAN.md:** 39 endpoints

**Status (อัพเดท 2025-01-27):**
- ✅ **Migrated:** 31 endpoints (ใช้จริงทั้งหมด)
- ❌ **Deleted (2025-01-27):** 8 endpoints (ไม่ได้ใช้จริง - ลบแล้วพร้อม Edge Functions)
- ❌ **Skip (Not Used):** 2 endpoints (system/auth, system/user-data) - ยังไม่ได้ลบ

**Recommendation:**
1. ✅ **Deleted** `/api/endpoints/core/leads/leads`, `/api/endpoints/core/leads/leads-complete`, `/api/endpoints/core/leads/leads-optimized`, และอื่นๆ - **ลบเสร็จแล้ว!**
2. ✅ **Edge Functions undeployed** - **เสร็จแล้ว!** (9 functions)
3. ✅ **Documentation updated** - **เสร็จแล้ว!**

---

## 🔍 วิธีการตรวจสอบ

การตรวจสอบครั้งนี้ทำโดย:
1. ✅ Grep `/api/endpoints/` ใน `src/` directory
2. ✅ เปรียบเทียบกับรายการใน `EDGE_MIGRATION_PLAN.md`
3. ✅ เปรียบเทียบกับ `api/README.md` และ `TASK_DEVELOPMENT_V2.md`
4. ✅ ตรวจสอบ hooks ที่เรียกใช้ endpoints

**Note:** การตรวจสอบนี้อาจไม่ได้ครอบคลุมทุกกรณี (เช่น dynamic imports, environment-specific code) แต่ครอบคลุมกรณีส่วนใหญ่แล้ว

