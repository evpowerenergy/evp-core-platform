# 📅 Date Filter Pattern Migration Plan - 16 API Endpoints

## 🎯 **สถานะปัจจุบัน**

### ✅ **ปรับปรุงแล้ว (13 APIs):**

**Initial APIs (4 APIs):**
1. ✅ `leads-for-dashboard.ts` - มี Date Filter, ใช้เป็นหลัก
2. ✅ `leads-optimized.ts` - เพิ่ม Date Filter, ใช้เป็นหลัก
3. ✅ `sales-team-data.ts` - มี Date Filter, ใช้เป็นหลัก
4. ✅ `service-appointments.ts` - มี Date Filter, ใช้เป็นหลัก

**Phase 1: High Priority Leads APIs (4/4 APIs) - ✅ COMPLETED:**
5. ✅ `leads-list.ts` - เพิ่ม Date Filter, ใช้เป็นหลัก ✅ **Completed**
6. ✅ `leads.ts` - เพิ่ม Date Filter, ใช้เป็นหลัก ✅ **Completed**
7. ✅ `lead-management.ts` - เพิ่ม Date Filter, ใช้เป็นหลัก ✅ **Completed**
8. ✅ `leads-complete.ts` - เพิ่ม Date Filter, ใช้เป็นหลัก ✅ **Completed**

**Phase 2: Transaction APIs (1/1 API) - ✅ COMPLETED:**
9. ✅ `purchase-orders.ts` - เพิ่ม Date Filter, ใช้เป็นหลัก (ใช้ `po_date`) ✅ **Completed**

**Phase 3: Products & Inventory APIs (4/4 APIs) - ✅ COMPLETED:**
10. ✅ `products.ts` - เพิ่ม Date Filter, ใช้เป็นหลัก (ใช้ `created_at_thai`) ✅ **Completed**
11. ✅ `products-management.ts` - เพิ่ม Date Filter, ใช้เป็นหลัก (ใช้ `created_at_thai`) ✅ **Completed**
12. ✅ `inventory-units.ts` - เพิ่ม Date Filter, ใช้เป็นหลัก (ใช้ `created_at_thai`) ✅ **Completed**
13. ✅ `inventory.ts` - เพิ่ม Date Filter, ใช้เป็นหลัก (composite API - filter แต่ละตาราง) ✅ **Completed**

---

## 📋 **แผนงาน: 16 API Endpoints**

### **Priority 1: Leads APIs (เหมาะสมที่สุดสำหรับ Date Filter)**

#### **1.1 Core Leads APIs (5 APIs)**

| # | API Endpoint | Current Limit | Status | Priority |
|---|-------------|---------------|--------|----------|
| 1 | `leads-optimized.ts` | Default: 50 | ✅ **Done** | - |
| 2 | `leads-list.ts` | Fixed: 100 | ✅ **Done** | - |
| 3 | `leads.ts` | Default: 100 | ✅ **Done** | - |
| 4 | `lead-management.ts` | Optional limit | ✅ **Done** | - |
| 5 | `leads-complete.ts` | Default: 100 | ✅ **Done** | - |
| 6 | `lead-detail.ts` | Fixed: 1 | ⚠️ **Skip** | - |

**เหตุผล:** Leads APIs ทั้งหมดมี `created_at_thai` field → เหมาะสมสำหรับ Date Filter

**Note:** `lead-detail.ts` (Fixed: 1) = Single record query → ไม่จำเป็นต้อง Date Filter

---

### **Priority 2: Products & Inventory APIs (พิจารณาตามความเหมาะสม)**

#### **2.1 Products APIs (2 APIs)**

| # | API Endpoint | Current Limit | Status | Priority |
|---|-------------|---------------|--------|----------|
| 7 | `products.ts` | Default: 100 | ✅ **Done** | - |
| 8 | `products-management.ts` | Default: 1000 | ✅ **Done** | - |

**คำถาม:** Products มี `created_at` field หรือไม่? → ถ้ามี = เหมาะสม, ถ้าไม่มี = อาจไม่จำเป็น

#### **2.2 Inventory APIs (1 API)**

| # | API Endpoint | Current Limit | Status | Priority |
|---|-------------|---------------|--------|----------|
| 9 | `inventory.ts` | Default: 1000 | ✅ **Done** | - |

**Note:** Inventory เป็น composite API → filter แต่ละตารางแยกกัน (products, inventory_units, purchase_orders, suppliers, customers, sales_docs)

#### **2.3 Inventory Units (1 API)**

| # | API Endpoint | Current Limit | Status | Priority |
|---|-------------|---------------|--------|----------|
| 10 | `inventory-units.ts` | Default: 100 | ✅ **Done** | - |

---

### **Priority 3: Transaction/Order APIs (พิจารณา date filter)**

#### **3.1 Purchase Orders (1 API)**

| # | API Endpoint | Current Limit | Status | Priority |
|---|-------------|---------------|--------|----------|
| 11 | `purchase-orders.ts` | Default: 100 | ✅ **Done** | - |

**เหตุผล:** Purchase Orders มักมี `created_at` หรือ `order_date` → เหมาะสมสำหรับ Date Filter

---

### **Priority 4: Single Record APIs (ไม่จำเป็นต้อง Date Filter)**

#### **4.1 Fixed Limit = 1 (3 APIs)**

| # | API Endpoint | Current Limit | Status | Decision |
|---|-------------|---------------|--------|----------|
| 12 | `customer-detail.ts` | Fixed: 1 | ⚠️ **Skip** | Single record query |
| 13 | `sale-follow-up.ts` | Fixed: 1 | ⚠️ **Skip** | Latest record only |
| 14 | `keep-alive.ts` | Fixed: 1 | ⚠️ **Skip** | Test query |

**เหตุผล:** Fixed limit = 1 = Single record queries → ไม่จำเป็นต้อง Date Filter

---

### **Priority 5: Special Cases (พิจารณาเป็นกรณีพิเศษ)**

#### **5.1 Special Date Filter (1 API)**

| # | API Endpoint | Current Limit | Status | Priority |
|---|-------------|---------------|--------|----------|
| 15 | `openai-sync.ts` | Max: 180 days | ⏳ Review | **Low** |

**เหตุผล:** มี date filter แล้ว (180 days) → อาจไม่ต้องปรับ (เป็น date filter แบบพิเศษ)

---

## 🎯 **สรุปแผนงาน**

### **✅ ปรับปรุงแล้ว (13 APIs):**

#### **High Priority (4 APIs) - ✅ COMPLETED:**
1. ✅ `leads-list.ts` - Fixed: 100 ✅ **Done**
2. ✅ `leads.ts` - Default: 100 ✅ **Done**
3. ✅ `lead-management.ts` - Optional limit ✅ **Done**
4. ✅ `leads-complete.ts` - Default: 100 ✅ **Done**

#### **Medium-High Priority (1 API) - ✅ COMPLETED:**
5. ✅ `purchase-orders.ts` - Default: 100 ✅ **Done** (ใช้ `po_date` สำหรับ Date Filter)

#### **Medium Priority (4 APIs) - ✅ COMPLETED:**
6. ✅ `products.ts` - Default: 100 ✅ **Done**
7. ✅ `products-management.ts` - Default: 1000 ✅ **Done**
8. ✅ `inventory.ts` - Default: 1000 ✅ **Done** (composite API)
9. ✅ `inventory-units.ts` - Default: 100 ✅ **Done**

### **⏳ ยังไม่ได้ปรับ (1 API):**
- ⏳ `openai-sync.ts` - Max: 180 days (มี date filter แล้ว → อาจไม่ต้องปรับ)

### **ไม่ต้องปรับ (6 APIs):**
- `lead-detail.ts` - Fixed: 1 (single record)
- `customer-detail.ts` - Fixed: 1 (single record)
- `sale-follow-up.ts` - Fixed: 1 (latest record)
- `keep-alive.ts` - Fixed: 1 (test query)
- `openai-sync.ts` - มี date filter แล้ว (180 days)
- `leads-for-dashboard.ts` - ✅ Done

---

## 📊 **Progress Tracking**

### **Overall Progress:**
- ✅ **Completed:** 13/16 APIs (81.25%)
- ⏳ **Pending:** 1/16 APIs (6.25%)
- ⚠️ **Skip:** 2/16 APIs (12.5%)

### **By Priority:**
- **High Priority:** 4/4 (100%) ✅ **COMPLETED**
- **Medium-High Priority:** 1/1 (100%) ✅ **COMPLETED**
- **Medium Priority:** 4/4 (100%) ✅ **COMPLETED** (Note: products-management is counted twice in the original count, but we fixed all actual APIs)

---

## 🚀 **Action Plan**

### **Phase 1: High Priority Leads APIs (4 APIs)**
**Goal:** ปรับ Leads APIs ให้รองรับ Date Filter เป็นหลัก

**Status:** ✅ **100% COMPLETE** (4/4 APIs)

**APIs:**
1. ✅ `leads-list.ts` - ✅ **Completed**
2. ✅ `leads.ts` - ✅ **Completed**
3. ✅ `lead-management.ts` - ✅ **Completed**
4. ✅ `leads-complete.ts` - ✅ **Completed** (ปรับ Node.js response methods + Date Filter + Vite plugin)

**Result:** Phase 1 เสร็จสมบูรณ์! 🎉

### **Phase 2: Transaction APIs (1 API)**
**Goal:** ปรับ Purchase Orders ให้รองรับ Date Filter

**Status:** ✅ **100% COMPLETE** (1/1 API)

**APIs:**
1. ✅ `purchase-orders.ts` - ✅ **Completed** (ใช้ `po_date` สำหรับ Date Filter)

**Result:** Phase 2 เสร็จสมบูรณ์! 🎉

### **Phase 3: Products & Inventory APIs (4 APIs)**
**Goal:** ตรวจสอบและปรับ Products & Inventory APIs (ถ้ามี timestamp fields)

**Status:** ✅ **100% COMPLETE** (4/4 APIs)

**APIs:**
1. ✅ `products.ts` - ✅ **Completed** (ใช้ `created_at_thai`)
2. ✅ `products-management.ts` - ✅ **Completed** (ใช้ `created_at_thai`)
3. ✅ `inventory.ts` - ✅ **Completed** (composite API - filter แต่ละตารางแยกกัน)
4. ✅ `inventory-units.ts` - ✅ **Completed** (ใช้ `created_at_thai`)

**Result:** Phase 3 เสร็จสมบูรณ์! 🎉

**Note:** `inventory.ts` เป็น composite API ที่ดึงข้อมูลจากหลายตาราง:
- products: ใช้ `created_at_thai`
- inventory_units: ใช้ `created_at_thai`
- purchase_orders: ใช้ `po_date` (business date)
- suppliers: ใช้ `created_at_thai`
- customers: ใช้ `created_at` (ไม่มี _thai)
- sales_docs: ใช้ `doc_date` (business date)

---

## 📝 **Implementation Checklist สำหรับแต่ละ API**

### **สำหรับ Leads APIs (มี `created_at_thai`):**
- [ ] เพิ่ม `from` และ `to` query parameters
- [ ] เพิ่ม date filter logic (`.gte()` และ `.lte()`)
- [ ] ปรับ limit logic ให้ใช้เป็น fallback
- [ ] อัพเดท response meta
- [ ] อัพเดท Frontend hook (ถ้ามี)

### **สำหรับ Products/Inventory APIs:**
- [ ] ตรวจสอบว่ามี timestamp field หรือไม่
- [ ] ถ้ามี → ใช้ Date Filter Pattern
- [ ] ถ้าไม่มี → พิจารณาเพิ่ม timestamp field หรือใช้ limit เป็นหลัก

### **สำหรับ Purchase Orders:**
- [ ] ตรวจสอบ field ที่เหมาะสม (created_at, order_date, etc.)
- [ ] เพิ่ม Date Filter Pattern
- [ ] อัพเดท Frontend hook

---

## 🔍 **Next Steps**

1. **เริ่มจาก Phase 1:** ปรับ Leads APIs (High Priority)
2. **ตรวจสอบ Phase 3:** ดูว่า Products/Inventory มี timestamp fields หรือไม่
3. **ทำ Phase 2:** ปรับ Purchase Orders
4. **Review & Test:** ทดสอบทุก API หลังปรับปรุง

---

**อัพเดทล่าสุด:** 2025-10-29
**สถานะ:** ✅ **ALL PHASES COMPLETED!** (81.25% Overall) | 🎉 **Migration Complete!**

