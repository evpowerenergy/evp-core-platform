# Local API → Edge Functions Mapping

**📌 เอกสารนี้แสดง mapping ระหว่าง Local API (`api/endpoints/`) กับ Supabase Edge Functions (`supabase/functions/`)**

**✅ Status:** Local API และ Edge Functions ตรงกันแล้ว (34 endpoints = 34 functions)

**อัพเดทล่าสุด:** 2025-01-27

---

## 📋 **Mapping Table**

### **🔵 Core APIs (17 mappings)**

| Local API | → | Edge Function |
|-----------|---|---------------|
| `api/endpoints/core/leads/lead-management.ts` | → | `supabase/functions/core-leads-lead-management/` |
| `api/endpoints/core/leads/lead-mutations.ts` | → | `supabase/functions/core-leads-lead-mutations/` |
| `api/endpoints/core/leads/leads-list.ts` | → | `supabase/functions/core-leads-leads-list/` |
| `api/endpoints/core/leads/leads-for-dashboard.ts` | → | `supabase/functions/core-leads-leads-for-dashboard/` |
| `api/endpoints/core/leads/lead-detail.ts` | → | `supabase/functions/core-leads-lead-detail/` |
| `api/endpoints/core/leads/phone-validation.ts` | → | `supabase/functions/core-leads-phone-validation/` |
| `api/endpoints/core/leads/sales-team-list.ts` | → | `supabase/functions/core-leads-sales-team-list/` |
| `api/endpoints/core/my-leads/my-leads.ts` | → | `supabase/functions/core-my-leads-my-leads/` |
| `api/endpoints/core/my-leads/my-leads-data.ts` | → | `supabase/functions/core-my-leads-my-leads-data/` |
| `api/endpoints/core/sales-team/sales-team.ts` | → | `supabase/functions/core-sales-team-sales-team/` |
| `api/endpoints/core/sales-team/sales-team-data.ts` | → | `supabase/functions/core-sales-team-sales-team-data/` |
| `api/endpoints/core/sales-team/filtered-sales-team.ts` | → | `supabase/functions/core-sales-team-filtered-sales-team/` |
| `api/endpoints/core/inventory/inventory.ts` | → | `supabase/functions/core-inventory-inventory/` |
| `api/endpoints/core/inventory/inventory-mutations.ts` | → | `supabase/functions/core-inventory-inventory-mutations/` |
| `api/endpoints/core/appointments/appointments.ts` | → | `supabase/functions/core-appointments-appointments/` |

---

### **🟢 Additional APIs (9 mappings)**

| Local API | → | Edge Function |
|-----------|---|---------------|
| `api/endpoints/additional/products/products.ts` | → | `supabase/functions/additional-products-products/` |
| `api/endpoints/additional/inventory/inventory-units.ts` | → | `supabase/functions/additional-inventory-inventory-units/` |
| `api/endpoints/additional/purchase-orders/purchase-orders.ts` | → | `supabase/functions/additional-purchase-orders-purchase-orders/` |
| `api/endpoints/additional/purchase-orders/purchase-order-mutations.ts` | → | `supabase/functions/additional-purchase-orders-purchase-order-mutations/` |
| `api/endpoints/additional/customer/customer-services.ts` | → | `supabase/functions/additional-customer-customer-services/` |
| `api/endpoints/additional/customer/customer-service-stats.ts` | → | `supabase/functions/additional-customer-customer-service-stats/` |
| `api/endpoints/additional/customer/customer-service-mutations.ts` | → | `supabase/functions/additional-customer-customer-service-mutations/` |
| `api/endpoints/additional/customer/customer-service-filters.ts` | → | `supabase/functions/additional-customer-customer-service-filters/` |
| `api/endpoints/additional/auth/user-data.ts` | → | `supabase/functions/additional-auth-user-data/` |

---

### **🔴 System APIs (10 mappings)**

| Local API | → | Edge Function |
|-----------|---|---------------|
| `api/endpoints/system/management/sales-team-management.ts` | → | `supabase/functions/system-management-sales-team-management/` |
| `api/endpoints/system/management/products-management.ts` | → | `supabase/functions/system-management-products-management/` |
| `api/endpoints/system/service/service-appointments.ts` | → | `supabase/functions/system-service-service-appointments/` |
| `api/endpoints/system/service/service-visits.ts` | → | `supabase/functions/system-service-service-visits/` |
| `api/endpoints/system/follow-up/sale-follow-up.ts` | → | `supabase/functions/system-follow-up-sale-follow-up/` |
| `api/endpoints/system/productivity/productivity-log-submission.ts` | → | `supabase/functions/system-productivity-productivity-log-submission/` |

---

### **⚙️ Infrastructure APIs (4 mappings)**

| Local API | → | Edge Function |
|-----------|---|---------------|
| `api/endpoints/system/openai-sync.ts` | → | `supabase/functions/system-openai-sync/` |
| `api/endpoints/system/keep-alive.ts` | → | `supabase/functions/system-keep-alive/` |
| `api/endpoints/system/csp-report.ts` | → | `supabase/functions/system-csp-report/` |
| `api/endpoints/system/health.ts` | → | `supabase/functions/system-health/` |

---

## 📊 **สรุป**

| Category | Local API | Edge Function | Status |
|----------|-----------|---------------|--------|
| **Core** | 15 | 15 | ✅ |
| **Additional** | 9 | 9 | ✅ |
| **System** | 6 | 6 | ✅ |
| **Infrastructure** | 4 | 4 | ✅ |
| **รวม** | **34** | **34** | **✅** |

---

## 🔄 **URL Pattern Mapping**

### **Local API (Development)**
```
/api/endpoints/core/leads/lead-management
```
**ใช้ใน:** `vite-plugin-api.ts` (Development server only)

### **Edge Function (Production)**
```
https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-leads-lead-management
```
**ใช้ใน:** Frontend hooks (Production)

---

## 📝 **Naming Convention**

### **Local API Path → Edge Function Name**

**Rule:**
1. แทน `/api/endpoints/` ด้วย `supabase/functions/`
2. แทน `/` ด้วย `-`
3. เอา `.ts` ออก
4. แปลงชื่อเป็น lowercase

**Examples:**
- `api/endpoints/core/leads/lead-management.ts` → `core-leads-lead-management`
- `api/endpoints/additional/customer/customer-services.ts` → `additional-customer-customer-services`
- `api/endpoints/system/health.ts` → `system-health`

---

## 🔗 **เอกสารที่เกี่ยวข้อง**

- 📖 **Local API:** `api/README.md` - รายการ Local API ทั้งหมด
- 🌐 **Edge Functions:** `supabase/functions/API_REFERENCE.md` - รายการ Edge Functions (Production)
- 📋 **Quick Reference:** `api/QUICK_REFERENCE.md` - สรุปเร็วๆ

---

## ✅ **ตรวจสอบ Mapping**

### **1. ตรวจสอบจำนวน**
```bash
# Local API files
find api/endpoints -name "*.ts" -type f ! -name "index.ts" | wc -l

# Edge Functions
find supabase/functions -name "index.ts" -type f | wc -l
```

### **2. ตรวจสอบชื่อ**
```bash
# ดู Local API
ls api/endpoints/core/leads/

# ดู Edge Functions
ls supabase/functions/ | grep core-leads
```

---

**หมายเหตุ:** 
- Local API ใช้สำหรับ **Development** เท่านั้น
- Edge Functions เป็น **Production API จริง**
- Frontend ใช้ Edge Functions ทั้งหมด (ไม่ใช้ Local API)

