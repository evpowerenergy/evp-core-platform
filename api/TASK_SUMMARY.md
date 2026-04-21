# API Task Summary - รายการ API ทั้งหมด

**📌 สำหรับสรุป Task:** แสดง Local API → Edge Function mapping แบบสั้นๆ

**อัพเดทล่าสุด:** 2025-01-27

---

## 📊 **สรุปจำนวน**

| Category | จำนวน |
|----------|-------|
| **Core APIs** | 15 |
| **Additional APIs** | 9 |
| **System APIs** | 6 |
| **Infrastructure APIs** | 4 |
| **รวม** | **34** |

---

## 📋 **รายการ Local API → Edge Function**

### **🔵 Core APIs (15 endpoints)**

1. `api/endpoints/core/leads/lead-management.ts` → `core-leads-lead-management`
2. `api/endpoints/core/leads/lead-mutations.ts` → `core-leads-lead-mutations`
3. `api/endpoints/core/leads/leads-list.ts` → `core-leads-leads-list`
4. `api/endpoints/core/leads/leads-for-dashboard.ts` → `core-leads-leads-for-dashboard`
5. `api/endpoints/core/leads/lead-detail.ts` → `core-leads-lead-detail`
6. `api/endpoints/core/leads/phone-validation.ts` → `core-leads-phone-validation`
7. `api/endpoints/core/leads/sales-team-list.ts` → `core-leads-sales-team-list`
8. `api/endpoints/core/my-leads/my-leads.ts` → `core-my-leads-my-leads`
9. `api/endpoints/core/my-leads/my-leads-data.ts` → `core-my-leads-my-leads-data`
10. `api/endpoints/core/sales-team/sales-team.ts` → `core-sales-team-sales-team`
11. `api/endpoints/core/sales-team/sales-team-data.ts` → `core-sales-team-sales-team-data`
12. `api/endpoints/core/sales-team/filtered-sales-team.ts` → `core-sales-team-filtered-sales-team`
13. `api/endpoints/core/inventory/inventory.ts` → `core-inventory-inventory`
14. `api/endpoints/core/inventory/inventory-mutations.ts` → `core-inventory-inventory-mutations`
15. `api/endpoints/core/appointments/appointments.ts` → `core-appointments-appointments`

---

### **🟢 Additional APIs (9 endpoints)**

16. `api/endpoints/additional/products/products.ts` → `additional-products-products`
17. `api/endpoints/additional/inventory/inventory-units.ts` → `additional-inventory-inventory-units`
18. `api/endpoints/additional/purchase-orders/purchase-orders.ts` → `additional-purchase-orders-purchase-orders`
19. `api/endpoints/additional/purchase-orders/purchase-order-mutations.ts` → `additional-purchase-orders-purchase-order-mutations`
20. `api/endpoints/additional/customer/customer-services.ts` → `additional-customer-customer-services`
21. `api/endpoints/additional/customer/customer-service-stats.ts` → `additional-customer-customer-service-stats`
22. `api/endpoints/additional/customer/customer-service-mutations.ts` → `additional-customer-customer-service-mutations`
23. `api/endpoints/additional/customer/customer-service-filters.ts` → `additional-customer-customer-service-filters`
24. `api/endpoints/additional/auth/user-data.ts` → `additional-auth-user-data`

---

### **🔴 System APIs (6 endpoints)**

25. `api/endpoints/system/management/sales-team-management.ts` → `system-management-sales-team-management`
26. `api/endpoints/system/management/products-management.ts` → `system-management-products-management`
27. `api/endpoints/system/service/service-appointments.ts` → `system-service-service-appointments`
28. `api/endpoints/system/service/service-visits.ts` → `system-service-service-visits`
29. `api/endpoints/system/follow-up/sale-follow-up.ts` → `system-follow-up-sale-follow-up`
30. `api/endpoints/system/productivity/productivity-log-submission.ts` → `system-productivity-productivity-log-submission`

---

### **⚙️ Infrastructure APIs (4 endpoints)**

31. `api/endpoints/system/openai-sync.ts` → `system-openai-sync`
32. `api/endpoints/system/keep-alive.ts` → `system-keep-alive`
33. `api/endpoints/system/csp-report.ts` → `system-csp-report`
34. `api/endpoints/system/health.ts` → `system-health`

---

## 📝 **รูปแบบสำหรับ Task Summary**

### **แบบสั้น (สำหรับ List)**
```
Local API (34) → Edge Functions (34)
✅ Core: 15 APIs
✅ Additional: 9 APIs  
✅ System: 6 APIs
✅ Infrastructure: 4 APIs
```

### **แบบเต็ม (สำหรับ Detail)**
```
api/endpoints/core/leads/lead-management.ts → core-leads-lead-management
api/endpoints/core/leads/lead-mutations.ts → core-leads-lead-mutations
api/endpoints/core/leads/leads-list.ts → core-leads-leads-list
...
(รวม 34 endpoints)
```

---

## 🔗 **เอกสารที่เกี่ยวข้อง**

- 📖 **Local API:** `api/README.md` - รายการ Local API ทั้งหมด
- 🔄 **Mapping:** `api/LOCAL_TO_EDGE_MAPPING.md` - Mapping แบบตาราง
- 🌐 **Edge Functions:** `supabase/functions/API_REFERENCE.md` - Edge Functions (Production)

---

**หมายเหตุ:** 
- Local API = Development เท่านั้น
- Edge Functions = Production (API จริง)

