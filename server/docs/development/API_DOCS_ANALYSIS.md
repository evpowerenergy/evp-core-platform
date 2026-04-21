# API Documentation Analysis

## 🎯 **Overview**

เอกสารนี้วิเคราะห์ API Endpoints ที่ใช้อยู่ทั้งหมดและเปรียบเทียบกับเอกสาร API (`/api-docs` และ `/api-docs/swagger`)

**วันที่วิเคราะห์:** 2025-01-27

---

## 📊 **API Endpoints ปัจจุบัน (จากโค้ด)**

### **Core APIs** (12 endpoints)

จาก `api/endpoints/core/index.ts`:
1. ✅ `lead-management`
2. ✅ `inventory`
3. ✅ `appointments`
4. ✅ `sales-team`
5. ✅ `my-leads`
6. ✅ `my-leads-data`
7. ✅ `sales-team-data`
8. ✅ `filtered-sales-team`
9. ✅ `lead-mutations`
10. ✅ `inventory-mutations`

**จาก `api/endpoints/core/leads/` (ไม่ export ใน index.ts):**
11. ✅ `leads-list`
12. ✅ `lead-detail`
13. ✅ `phone-validation`
14. ✅ `leads-for-dashboard`
15. ✅ `sales-team-list`

**รวม Core APIs:** ~15 endpoints

---

### **Additional APIs** (9 endpoints)

จาก `api/endpoints/additional/index.ts`:
1. ✅ `products`
2. ✅ `inventory-units`
3. ✅ `purchase-orders`
4. ✅ `purchase-order-mutations`
5. ✅ `customer-services`
6. ✅ `customer-service-stats`
7. ✅ `customer-service-mutations`
8. ✅ `customer-service-filters`
9. ✅ `user-data`

**รวม Additional APIs:** 9 endpoints

---

### **System APIs** (9 endpoints)

จาก `api/endpoints/system/index.ts`:
1. ✅ `user-data` (duplicate? กับ additional)
2. ✅ `auth` (❌ ลบแล้ว - DELETED 2025-01-27)
3. ✅ `sales-team-management`
4. ✅ `products-management`
5. ✅ `sale-follow-up` (อยู่ใน `follow-up/`)
6. ✅ `service-appointments` (อยู่ใน `service/`)
7. ✅ `service-visits` (อยู่ใน `visits/`)
8. ✅ `productivity-logs` (อยู่ใน `logs/`)

**System Root Files:**
9. ✅ `health`
10. ✅ `keep-alive`
11. ✅ `csp-report`
12. ✅ `openai-sync`

**รวม System APIs:** ~11 endpoints (ไม่รวม auth ที่ลบแล้ว)

---

### **📌 สรุป API Endpoints จริง**

| Category | Count | Notes |
|----------|-------|-------|
| **Core** | ~15 | รวม endpoints ที่ไม่ export ใน index.ts |
| **Additional** | 9 | |
| **System** | ~11 | ไม่รวม auth ที่ลบแล้ว |
| **รวม** | **~35** | |

---

## 📝 **API ที่ลงทะเบียนใน OpenAPI (`generate-openapi.ts`)**

### **Core APIs** (13 endpoints)
1. ✅ `/api/endpoints/core/leads/lead-management`
2. ✅ `/api/endpoints/core/leads/lead-mutations`
3. ❌ `/api/endpoints/core/leads/leads-complete` - **ลบแล้ว** (DELETED 2025-01-27)
4. ❌ `/api/endpoints/core/leads/leads-optimized` - **ลบแล้ว** (DELETED 2025-01-27)
5. ✅ `/api/endpoints/core/leads/leads-list`
6. ✅ `/api/endpoints/core/leads/leads-for-dashboard`
7. ✅ `/api/endpoints/core/leads/lead-detail`
8. ✅ `/api/endpoints/core/leads/phone-validation`
9. ✅ `/api/endpoints/core/my-leads/my-leads-data`
10. ✅ `/api/endpoints/core/my-leads/my-leads`
11. ✅ `/api/endpoints/core/sales-team/sales-team`
12. ✅ `/api/endpoints/core/sales-team/sales-team-data`
13. ✅ `/api/endpoints/core/sales-team/filtered-sales-team`
14. ✅ `/api/endpoints/core/leads/sales-team-list`
15. ✅ `/api/endpoints/core/inventory/inventory`
16. ✅ `/api/endpoints/core/inventory/inventory-mutations`
17. ✅ `/api/endpoints/core/appointments/appointments`

**รวม:** 15 endpoints (ไม่รวม 2 endpoints ที่ลบแล้ว)

---

### **Additional APIs** (8 endpoints)
1. ✅ `/api/endpoints/additional/products/products`
2. ✅ `/api/endpoints/additional/inventory/inventory-units`
3. ✅ `/api/endpoints/additional/purchase-orders/purchase-orders`
4. ✅ `/api/endpoints/additional/purchase-orders/purchase-order-mutations`
5. ✅ `/api/endpoints/additional/customer/customer-services`
6. ✅ `/api/endpoints/additional/customer/customer-service-stats`
7. ✅ `/api/endpoints/additional/customer/customer-service-mutations`
8. ✅ `/api/endpoints/additional/customer/customer-service-filters`
9. ❌ `/api/endpoints/additional/auth/auth` - **ลบแล้ว** (DELETED 2025-01-27)
10. ✅ `/api/endpoints/additional/auth/user-data`

**รวม:** 9 endpoints (ไม่รวม auth ที่ลบแล้ว)

---

### **System APIs** (9 endpoints)
1. ✅ `/api/endpoints/system/management/sales-team-management`
2. ✅ `/api/endpoints/system/management/products-management`
3. ✅ `/api/endpoints/system/service/service-appointments`
4. ✅ `/api/endpoints/system/service/service-visits`
5. ✅ `/api/endpoints/system/productivity/productivity-log-submission`
6. ❌ `/api/openai-usage` - **ลบแล้ว** (DELETED 2025-01-27)
7. ✅ `/api/openai-sync`
8. ✅ `/api/keep-alive`
9. ✅ `/api/csp-report`
10. ✅ `/api/health`

**รวม:** 9 endpoints (ไม่รวม openai-usage ที่ลบแล้ว)

---

### **📌 สรุป API ใน OpenAPI**

| Category | Count | Issues |
|----------|-------|--------|
| **Core** | 15 | ❌ มี 2 endpoints ที่ลบแล้ว (leads-complete, leads-optimized) |
| **Additional** | 9 | ❌ มี 1 endpoint ที่ลบแล้ว (auth) |
| **System** | 9 | ❌ มี 1 endpoint ที่ลบแล้ว (openai-usage) |
| **รวม** | **33** | ❌ มี **4 endpoints ที่ลบแล้ว** ยังอยู่ใน OpenAPI |

---

## ⚠️ **ปัญหา: API ที่ลบแล้วแต่ยังอยู่ใน OpenAPI**

### **Endpoints ที่ต้องลบออกจาก `generate-openapi.ts`:**

1. ❌ `/api/endpoints/core/leads/leads-complete` (DELETED 2025-01-27)
   - Line 73 ใน `scripts/generate-openapi.ts`
   - **Action:** ลบ `registerGet` ออก

2. ❌ `/api/endpoints/core/leads/leads-optimized` (DELETED 2025-01-27)
   - Line 74 ใน `scripts/generate-openapi.ts`
   - **Action:** ลบ `registerGet` ออก

3. ❌ `/api/endpoints/additional/auth/auth` (DELETED 2025-01-27)
   - Line 108 ใน `scripts/generate-openapi.ts`
   - **Action:** ลบ `registerPost` ออก

4. ❌ `/api/openai-usage` (DELETED 2025-01-27)
   - Line 117 ใน `scripts/generate-openapi.ts`
   - **Action:** ลบ `registerPost` ออก

---

## ✅ **API ที่ไม่มีใน OpenAPI แต่ควรมี**

ตรวจสอบ endpoints ที่มีจริงในโค้ด แต่ไม่ได้ลงทะเบียนใน OpenAPI:

### **Core:**
- ✅ `sales-team-list` (อยู่ใน `/api/endpoints/core/leads/sales-team-list`) - **มีใน OpenAPI แล้ว**

### **System:**
- ❓ `follow-up/sale-follow-up` - **ไม่มีใน OpenAPI**
  - Path: `/api/endpoints/system/follow-up/sale-follow-up`
  - **Action:** เพิ่ม `registerPost` ใน OpenAPI

---

## 📊 **สรุปการเปรียบเทียบ**

| สถานะ | จำนวน | หมายเหตุ |
|-------|-------|----------|
| **API จริง** | ~35 | รวม endpoints ที่ใช้อยู่ |
| **API ใน OpenAPI** | 33 | รวม endpoints ที่ลบแล้ว |
| **ต้องลบออก** | 4 | endpoints ที่ลบแล้ว |
| **ต้องเพิ่ม** | 1 | sale-follow-up |
| **API ที่ถูกต้อง** | **30** | หลังจากแก้ไข |

---

## 🔧 **Action Items**

### **1. อัพเดท `generate-openapi.ts`**
- [ ] ลบ `leads-complete` (line 73)
- [ ] ลบ `leads-optimized` (line 74)
- [ ] ลบ `additional/auth/auth` (line 108)
- [ ] ลบ `openai-usage` (line 117)
- [ ] เพิ่ม `system/follow-up/sale-follow-up`

### **2. Generate OpenAPI Spec ใหม่**
```bash
npm run gen:openapi
```

### **3. ตรวจสอบเอกสาร**
- [ ] เปิด `/api-docs` (Redoc)
- [ ] เปิด `/api-docs/swagger` (Swagger UI)
- [ ] ตรวจสอบว่า endpoints ที่ลบแล้วไม่มีแล้ว
- [ ] ตรวจสอบว่า endpoints ที่ใช้อยู่มีครบ

---

**Updated:** 2025-01-27

