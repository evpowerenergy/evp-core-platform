# API Quick Reference - รายการ API ทั้งหมด

**⚠️ สิ่งสำคัญ:** เอกสารนี้แสดง **Local API** (`api/endpoints/`) ซึ่งใช้สำหรับ **Development เท่านั้น**

**📌 API จริงที่ใช้ใน Production:** ดูที่ `supabase/functions/API_REFERENCE.md` แทน

**อัพเดทล่าสุด:** 2025-01-27

---

## 🎯 **Local API vs Edge Functions**

### **Local API (`api/endpoints/`)**
- ❌ **ไม่ใช่ API จริง** - ใช้สำหรับ Development
- ⚠️ **Frontend ไม่ได้ใช้แล้ว** - ใช้ Supabase Edge Functions แทน
- 📍 **ดูเพื่อเข้าใจ structure** เท่านั้น

### **Supabase Edge Functions (`supabase/functions/`)**
- ✅ **นี่คือ API จริง** - ใช้ใน Production
- ✅ **Frontend ใช้ทั้งหมด**
- 📍 **ดูที่:** `supabase/functions/API_REFERENCE.md`

---

## 📍 **วิธีดู API ทั้งหมด**

### **1. ไฟล์เอกสารหลัก**
- **`api/README.md`** - Overview และรายการ API แยกตามหมวดหมู่
- **`api/docs/development/API_DOCS_ANALYSIS.md`** - วิเคราะห์ API ทั้งหมดแบบละเอียด

### **2. ไฟล์ Source Code**
- **`scripts/generate-openapi.ts`** - ไฟล์ที่ลงทะเบียน API ทั้งหมด (ใช้สำหรับ generate OpenAPI spec)
- **`api/endpoints/core/index.ts`** - Core APIs exports
- **`api/endpoints/additional/index.ts`** - Additional APIs exports
- **`api/endpoints/system/index.ts`** - System APIs exports

### **3. Interactive Documentation (เมื่อรัน dev server)**
- **`http://localhost:8080/api-docs`** - Redoc UI (สวยกว่า)
- **`http://localhost:8080/api-docs/swagger`** - Swagger UI
- **`http://localhost:8080/api-docs/openapi.json`** - OpenAPI JSON spec

---

## 📋 **รายการ API ทั้งหมด (32 endpoints)**

### **🔵 Core APIs (17 endpoints)**

#### **Leads & My Leads**
1. `GET /api/endpoints/core/leads/lead-management` - Lead management
2. `POST /api/endpoints/core/leads/lead-mutations` - Lead mutations
3. `GET /api/endpoints/core/leads/leads-list` - Leads list
4. `GET /api/endpoints/core/leads/leads-for-dashboard` - Leads for dashboard
5. `GET /api/endpoints/core/leads/lead-detail` - Lead detail
6. `POST /api/endpoints/core/leads/phone-validation` - Phone validation
7. `GET /api/endpoints/core/leads/sales-team-list` - Sales team list
8. `GET /api/endpoints/core/my-leads/my-leads` - My leads
9. `GET /api/endpoints/core/my-leads/my-leads-data` - My leads data

#### **Sales Team**
10. `GET /api/endpoints/core/sales-team/sales-team` - Sales team
11. `GET /api/endpoints/core/sales-team/sales-team-data` - Sales team data
12. `GET /api/endpoints/core/sales-team/filtered-sales-team` - Filtered sales team

#### **Inventory**
13. `GET /api/endpoints/core/inventory/inventory` - Inventory
14. `POST /api/endpoints/core/inventory/inventory-mutations` - Inventory mutations

#### **Appointments**
15. `GET /api/endpoints/core/appointments/appointments` - Appointments

---

### **🟢 Additional APIs (9 endpoints)**

#### **Products & Inventory**
16. `GET /api/endpoints/additional/products/products` - Products
17. `GET /api/endpoints/additional/inventory/inventory-units` - Inventory units

#### **Purchase Orders**
18. `GET /api/endpoints/additional/purchase-orders/purchase-orders` - Purchase orders
19. `POST /api/endpoints/additional/purchase-orders/purchase-order-mutations` - Purchase order mutations

#### **Customer Services**
20. `GET /api/endpoints/additional/customer/customer-services` - Customer services
21. `GET /api/endpoints/additional/customer/customer-service-stats` - Customer service stats
22. `POST /api/endpoints/additional/customer/customer-service-mutations` - Customer service mutations
23. `GET /api/endpoints/additional/customer/customer-service-filters` - Customer service filters

#### **Auth**
24. `GET /api/endpoints/additional/auth/user-data` - User data

---

### **🔴 System APIs (6 endpoints)**

#### **Management**
25. `GET /api/endpoints/system/management/sales-team-management` - Sales team management
26. `GET /api/endpoints/system/management/products-management` - Products management

#### **Service**
27. `GET /api/endpoints/system/service/service-appointments` - Service appointments
28. `GET /api/endpoints/system/service/service-visits` - Service visits

#### **Follow-up**
29. `POST /api/endpoints/system/follow-up/sale-follow-up` - Sale follow-up (POST)
30. `GET /api/endpoints/system/follow-up/sale-follow-up` - Sale follow-up (GET)

#### **Productivity**
31. `POST /api/endpoints/system/productivity/productivity-log-submission` - Productivity log submission

---

### **⚙️ Infrastructure APIs (4 endpoints)**

32. `POST /api/openai-sync` - OpenAI sync
33. `GET /api/keep-alive` - Keep alive
34. `POST /api/csp-report` - CSP report
35. `GET /api/health` - Health

---

## 📊 **สถิติ**

| Category | Count |
|----------|-------|
| **Core** | 17 |
| **Additional** | 9 |
| **System** | 6 |
| **Infrastructure** | 4 |
| **รวม** | **36** |

---

## 🔗 **ลิงก์ที่เกี่ยวข้อง**

- 📖 **API Documentation:** `api/README.md`
- 📊 **API Analysis:** `api/docs/development/API_DOCS_ANALYSIS.md`
- 🔧 **OpenAPI Generator:** `scripts/generate-openapi.ts`
- 🌐 **Live Docs:** `/api-docs` (เมื่อรัน dev server)

---

**หมายเหตุ:** 
- API endpoints เหล่านี้ใช้สำหรับ **Development** เท่านั้น
- สำหรับ **Production** จะใช้ Supabase Edge Functions (`supabase/functions/`) แทน
- Local API และ Edge Functions ตรงกันแล้ว (36 endpoints/functions)

