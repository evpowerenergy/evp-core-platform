# EV Power Energy CRM - API Documentation

## 🎯 **Overview**
This directory contains the organized API endpoints for the EV Power Energy CRM system, structured for better maintainability and scalability.

**📌 Important:** API endpoints ใน `api/endpoints/` ใช้สำหรับ **Development** เท่านั้น สำหรับ **Production** จะใช้ Supabase Edge Functions (`supabase/functions/`) แทน

**✅ Status:** Local API และ Edge Functions **ตรงกันแล้ว** (34 endpoints/functions)

---

## 📁 **Folder Structure**

### **🔧 API Endpoints**
- **`endpoints/core/`** - Core business APIs (Priority 1)
  - **`leads/`** - Lead management (lead-management, leads-list, lead-detail, lead-mutations, phone-validation, sales-team-list, leads-for-dashboard)
  - **`my-leads/`** - My leads (my-leads, my-leads-data)
  - **`sales-team/`** - Sales team (sales-team, sales-team-data, filtered-sales-team)
  - **`inventory/`** - Inventory (inventory, inventory-mutations)
  - **`appointments/`** - Appointments (appointments)

- **`endpoints/additional/`** - Additional functionality APIs (Priority 2)
  - **`products/`** - Product management (products)
  - **`inventory/`** - Extended inventory (inventory-units)
  - **`purchase-orders/`** - Purchase orders (purchase-orders, purchase-order-mutations)
  - **`customer/`** - Customer services extended (customer-services, customer-service-stats, customer-service-mutations, customer-service-filters)
  - **`auth/`** - User data (user-data)

- **`endpoints/system/`** - System and utility APIs (Priority 3)
  - **`management/`** - Management (sales-team-management, products-management)
  - **`service/`** - Service operations (service-appointments, service-visits)
  - **`follow-up/`** - Follow-up (sale-follow-up)
  - **`productivity/`** - Productivity (productivity-log-submission)
  - Root files: health, keep-alive, csp-report, openai-sync

### **📚 Documentation**
- **`docs/analysis/`** - Analysis and research documents
- **`docs/development/`** - Development process documents
- **`docs/mapping/`** - API mapping and reference documents
- **`docs/diagrams/`** - Visual diagrams and charts

---

## 🚀 **Quick Start**

### **Core APIs**
```typescript
// Leads & My Leads
GET  /api/endpoints/core/leads/lead-management
GET  /api/endpoints/core/leads/leads-list
POST /api/endpoints/core/leads/lead-mutations
GET  /api/endpoints/core/my-leads/my-leads
GET  /api/endpoints/core/my-leads/my-leads-data

// Sales Team
GET  /api/endpoints/core/sales-team/sales-team
GET  /api/endpoints/core/sales-team/sales-team-data
GET  /api/endpoints/core/sales-team/filtered-sales-team

// Inventory
GET  /api/endpoints/core/inventory/inventory
POST /api/endpoints/core/inventory/inventory-mutations

// Appointments
GET  /api/endpoints/core/appointments/appointments
```

### **Additional APIs**
```typescript
// Products & Inventory
GET  /api/endpoints/additional/products/products
GET  /api/endpoints/additional/inventory/inventory-units

// Purchase Orders
GET  /api/endpoints/additional/purchase-orders/purchase-orders
POST /api/endpoints/additional/purchase-orders/purchase-order-mutations

// Customer Services
GET  /api/endpoints/additional/customer/customer-services
GET  /api/endpoints/additional/customer/customer-service-stats
POST /api/endpoints/additional/customer/customer-service-mutations
```

### **System APIs**
```typescript
// Management
POST /api/endpoints/system/management/sales-team-management
POST /api/endpoints/system/management/products-management

// Service & Ops
POST /api/endpoints/system/openai-sync
POST /api/endpoints/system/follow-up/sale-follow-up
GET  /api/endpoints/system/health
GET  /api/endpoints/system/keep-alive
POST /api/endpoints/system/csp-report
```

---

## 📊 **API Statistics**

| Category | Endpoints | Status |
|----------|-----------|---------|
| **Core APIs** | 15 | ✅ Complete |
| **Additional APIs** | 9 | ✅ Complete |
| **System APIs** | 10 | ✅ Complete |
| **Total** | **34** | **✅ Complete** |

Note: Counts exclude `index.ts` files and reflect current files in `endpoints/`.

---

## 📒 **Full Endpoint List**

### Core
- `/api/endpoints/core/appointments/appointments` — [USED] (hook: useAppointmentsAPI)
- (removed) `/api/endpoints/core/appointments/service-appointments` — replaced by `/api/endpoints/system/service/service-appointments`
- (removed) `/api/endpoints/core/appointments/service-visits` — replaced by `/api/endpoints/system/service/service-visits`
- `/api/endpoints/core/inventory/inventory` — [USED] (hook: useInventoryDataAPI)
- `/api/endpoints/core/inventory/inventory-mutations` — [USED] (hook: useInventoryDataAPI)
- (removed) `/api/endpoints/core/inventory/products-management` — replaced by `/api/endpoints/system/management/products-management`
- `/api/endpoints/core/leads/lead-detail` — [USED] (hook: useLeadDetailAPI)
- `/api/endpoints/core/leads/lead-management` — [USED] (hook: useAppDataAPI)
- `/api/endpoints/core/leads/lead-mutations` — [USED] (hooks: useAppDataAPI, useLeadsAPI)
- `/api/endpoints/core/leads/leads-for-dashboard` — [USED] (page: Index.tsx)
- `/api/endpoints/core/leads/leads-list` — [USED] (hook: useLeadsAPI)
- `/api/endpoints/core/leads/phone-validation` — [USED] (util: src/utils/leadValidation.ts)
- ~~`/api/endpoints/core/leads/leads`~~ — [DELETED] (2025-01-27: Legacy/Unused)
- ~~`/api/endpoints/core/leads/leads-complete`~~ — [DELETED] (2025-01-27: Legacy/Unused)
- ~~`/api/endpoints/core/leads/leads-optimized`~~ — [DELETED] (2025-01-27: Experimental/Unused - Page removed)
- `/api/endpoints/core/leads/sales-team-list` — [USED] (hook: useLeadsAPI)
- `/api/endpoints/core/my-leads/my-leads` — [USED] (hook: useMyLeadsWithMutations in useAppDataAPI)
- `/api/endpoints/core/my-leads/my-leads-data` — [USED] (hook: useMyLeadsData in useAppDataAPI)
- `/api/endpoints/core/sales-team/filtered-sales-team` — [USED] (hook: useAppDataAPI)
- `/api/endpoints/core/sales-team/sales-team` — [USED] (hook: useAppDataAPI)
- `/api/endpoints/core/sales-team/sales-team-data` — [USED] (hook: useAppDataAPI)
- (removed) `/api/endpoints/core/sales-team/sales-team-management` — replaced by `/api/endpoints/system/management/sales-team-management`
- ~~`/api/endpoints/core/customer-services/customer-detail`~~ — [DELETED] (2025-01-27: Legacy/Prepared - not used in Frontend)

### Additional
- `/api/endpoints/additional/auth/user-data` — [USED] (hook: useUserDataAPI)
- ~~`/api/endpoints/additional/auth/auth`~~ — [DELETED] (2025-01-27: Frontend uses Supabase client directly)
- `/api/endpoints/additional/customer/customer-service-filters` — [USED] (hook: useCustomerServicesAPI)
- `/api/endpoints/additional/customer/customer-service-mutations` — [USED] (hook: useCustomerServicesAPI)
- `/api/endpoints/additional/customer/customer-service-stats` — [USED] (hook: useCustomerServicesAPI)
- `/api/endpoints/additional/customer/customer-services` — [USED] (hook: useCustomerServicesAPI)
- `/api/endpoints/additional/inventory/inventory-units` — [USED] (hook: useInventoryDataAPI)
- `/api/endpoints/additional/products/products` — [USED] (hook: useInventoryDataAPI)
- `/api/endpoints/additional/purchase-orders/purchase-order-mutations` — [USED] (hook: useInventoryDataAPI)
- ~~`/api/endpoints/additional/follow-up/sale-follow-up`~~ — [DELETED] (2025-01-27: Frontend uses `/system/follow-up/sale-follow-up` instead)
- ~~`/api/endpoints/additional/productivity/productivity-logs`~~ — [DELETED] (2025-01-27: Frontend uses `/system/productivity/productivity-log-submission` instead)
- `/api/endpoints/additional/purchase-orders/purchase-orders` — [USED] (hook: useInventoryDataAPI)

### System
- `/api/endpoints/system/csp-report` — [INFRA] (direct)
- `/api/endpoints/system/health` — [INFRA] (direct)
- `/api/endpoints/system/keep-alive` — [INFRA] (direct/cron)
- `/api/endpoints/system/openai-sync` — [USED] (hook: useOpenAICost)
- ~~`/api/endpoints/system/openai-usage`~~ — [DELETED] (2025-01-27: Legacy - Frontend doesn't use directly)
- `/api/endpoints/system/follow-up/sale-follow-up` — [USED] (hook: useSaleFollowUpAPI)
- `/api/endpoints/system/management/products-management` — [USED] (hook: useProductsAPI)
- `/api/endpoints/system/management/sales-team-management` — [USED] (hook: useSalesTeamAPI)
- `/api/endpoints/system/productivity/productivity-log-submission` — [USED] (hook: useProductivityLogSubmissionAPI)
- `/api/endpoints/system/service/service-appointments` — [USED] (hook: useServiceAppointmentsAPI)
- `/api/endpoints/system/service/service-visits` — [USED] (hook: useServiceVisitsAPI)

---

## 📈 Usage Breakdown

| Category    | USED | PLANNED | INFRA | NOT_USED | Total |
|----------   |------|---------|-------|----------|-------|
| Core        | 15   | 0       | 0     | 0        | 15 |
| Additional  | 9    | 0       | 0     | 0        | 9 |
| System      | 8    | 0       | 2     | 0        | 10 |
| Total       | 32   | 0       | 2     | 0        | 34 |

Notes:
- USED: เรียกใช้งานจริงผ่าน hooks/pages ที่อ้างถึงไว้ด้านบน
- PLANNED: สร้างไว้/พร้อมใช้งาน แต่ยังไม่พบการเรียกจาก UI ตอนนี้
- INFRA: งานระบบ เช่น health, keep-alive, csp-report (ถูกเรียกโดยระบบ/cron/headers)
- NOT_USED = PLANNED + INFRA + รายการที่ติดป้าย [NOT_USED]/[OPTIONAL]
- DEPRECATED: มี endpoint ตัวแทนที่ถูกต้องกว่าใน `system/*` ให้ใช้แทน
- OPTIONAL: ไว้รองรับกรณีมีหน้าหรือ use-case ใหม่ในอนาคต แต่ยังไม่อยู่ใน scope ตอนนี้

## 🔧 **Development**

### **Adding New APIs**

**📌 สำคัญ:** Frontend ใช้ Supabase Edge Functions ทั้งหมดแล้ว ดังนั้น:

**✅ แนะนำ:** เขียน Edge Functions โดยตรงที่ `supabase/functions/`
- ไม่ต้อง migrate ภายหลัง
- Frontend ใช้ได้ทันที
- Production-ready

**หรือ:** เขียน Local API ที่ `api/endpoints/` ก่อน (ถ้าต้องการพัฒนาเร็ว) แล้วค่อย migrate

**ดูรายละเอียด:** `api/docs/development/DEVELOPMENT_WORKFLOW.md`

### **Steps (ถ้าเขียน Local API)**
1. Create endpoint in appropriate folder
2. Follow naming conventions
3. Update documentation
4. Test functionality
5. **Migrate to Edge Functions** (ถ้าใช้ Option 2)

### **Folder Guidelines**
- **Core APIs:** Main business logic
- **Additional APIs:** Extended functionality
- **System APIs:** Infrastructure and utilities

---

## 📚 **Documentation**

- **Analysis:** `/docs/analysis/` - Research and analysis documents
- **Development:** `/docs/development/` - Development process
- **Mapping:** `/docs/mapping/` - API mapping references
- **Diagrams:** `/docs/diagrams/` - Visual documentation

---

## 🎯 **Benefits of This Structure**

✅ **Clear Organization** - Related APIs grouped together  
✅ **Easy Navigation** - Logical folder hierarchy  
✅ **Scalable** - Easy to add new APIs  
✅ **Maintainable** - Clear separation of concerns  
✅ **Professional** - Industry-standard structure  

---

## 🚀 **Next Steps**

1. **Phase 3:** Migrate hooks to use new API endpoints
2. **Phase 4:** Test all API endpoints
3. **Phase 5:** Performance optimization
4. **Phase 6:** Production deployment

---

**This organized structure makes the API much more maintainable and professional!** 🎉
