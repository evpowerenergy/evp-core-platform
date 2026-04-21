# Supabase Edge Functions - API Reference (Production)

**📌 สิ่งสำคัญ:** เอกสารนี้แสดง **API จริง** ที่ใช้ใน Production

**✅ Status:** มี Edge Functions ทั้งหมด **34 functions** (ตรงกับ Local API)

**อัพเดทล่าสุด:** 2025-01-27

---

## 🎯 **API จริงคืออะไร?**

### **Local API (`api/endpoints/`)** 
- ❌ **ไม่ใช่ API จริง** - ใช้สำหรับ Development เท่านั้น
- ⚠️ **Frontend ไม่ได้ใช้แล้ว** - ใช้ Supabase Edge Functions แทน

### **Supabase Edge Functions (`supabase/functions/`)**
- ✅ **นี่คือ API จริง** - ใช้ใน Production
- ✅ **Frontend ใช้ทั้งหมด** - ผ่าน Edge Function URLs

---

## 📋 **รายการ Edge Functions ทั้งหมด (34 functions)**

### **🔵 Core APIs (17 functions)**

#### **Leads & My Leads**
1. `core-leads-lead-management`
   - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-leads-lead-management`
   - Method: GET

2. `core-leads-lead-mutations`
   - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-leads-lead-mutations`
   - Method: POST

3. `core-leads-leads-list`
   - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-leads-leads-list`
   - Method: GET

4. `core-leads-leads-for-dashboard`
   - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-leads-leads-for-dashboard`
   - Method: GET

5. `core-leads-lead-detail`
   - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-leads-lead-detail`
   - Method: GET

6. `core-leads-phone-validation`
   - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-leads-phone-validation`
   - Method: POST

7. `core-leads-sales-team-list`
   - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-leads-sales-team-list`
   - Method: GET

8. `core-my-leads-my-leads`
   - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-my-leads-my-leads`
   - Method: GET

9. `core-my-leads-my-leads-data`
   - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-my-leads-my-leads-data`
   - Method: GET

#### **Sales Team**
10. `core-sales-team-sales-team`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-sales-team-sales-team`
    - Method: GET

11. `core-sales-team-sales-team-data`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-sales-team-sales-team-data`
    - Method: GET

12. `core-sales-team-filtered-sales-team`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-sales-team-filtered-sales-team`
    - Method: GET

#### **Inventory**
13. `core-inventory-inventory`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-inventory-inventory`
    - Method: GET

14. `core-inventory-inventory-mutations`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-inventory-inventory-mutations`
    - Method: POST

#### **Appointments**
15. `core-appointments-appointments`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/core-appointments-appointments`
    - Method: GET

---

### **🟢 Additional APIs (9 functions)**

#### **Products & Inventory**
16. `additional-products-products`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/additional-products-products`
    - Method: GET

17. `additional-inventory-inventory-units`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/additional-inventory-inventory-units`
    - Method: GET

#### **Purchase Orders**
18. `additional-purchase-orders-purchase-orders`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/additional-purchase-orders-purchase-orders`
    - Method: GET

19. `additional-purchase-orders-purchase-order-mutations`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/additional-purchase-orders-purchase-order-mutations`
    - Method: POST

#### **Customer Services**
20. `additional-customer-customer-services`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/additional-customer-customer-services`
    - Method: GET

21. `additional-customer-customer-service-stats`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/additional-customer-customer-service-stats`
    - Method: GET

22. `additional-customer-customer-service-mutations`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/additional-customer-customer-service-mutations`
    - Method: POST

23. `additional-customer-customer-service-filters`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/additional-customer-customer-service-filters`
    - Method: GET

#### **Auth**
24. `additional-auth-user-data`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/additional-auth-user-data`
    - Method: GET

---

### **🔴 System APIs (10 functions)**

#### **Management**
25. `system-management-sales-team-management`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/system-management-sales-team-management`
    - Method: GET

26. `system-management-products-management`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/system-management-products-management`
    - Method: GET

#### **Service**
27. `system-service-service-appointments`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/system-service-service-appointments`
    - Method: GET

28. `system-service-service-visits`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/system-service-service-visits`
    - Method: GET

#### **Follow-up**
29. `system-follow-up-sale-follow-up`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/system-follow-up-sale-follow-up`
    - Method: GET, POST

#### **Productivity**
30. `system-productivity-productivity-log-submission`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/system-productivity-productivity-log-submission`
    - Method: POST

---

### **⚙️ Infrastructure APIs (4 functions)**

31. `system-openai-sync`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/system-openai-sync`
    - Method: POST

32. `system-keep-alive`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/system-keep-alive`
    - Method: GET

33. `system-csp-report`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/system-csp-report`
    - Method: POST

34. `system-health`
    - URL: `https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/system-health`
    - Method: GET

---

## 📊 **สถิติ**

| Category | Count |
|----------|-------|
| **Core** | 17 |
| **Additional** | 9 |
| **System** | 10 |
| **Infrastructure** | 4 |
| **รวม** | **40** |

**หมายเหตุ:** นับ `sale-follow-up` เป็น GET + POST = 2 methods

---

## 🔍 **วิธีดู Edge Functions**

### **1. ในโค้ด (Source Code)**
```
supabase/functions/
├── core-leads-lead-management/
│   └── index.ts
├── core-leads-leads-list/
│   └── index.ts
└── ...
```

### **2. Deploy Status**
```bash
# ดู functions ที่ deploy แล้ว
supabase functions list

# ดูรายละเอียด function
supabase functions inspect your-function-name
```

### **3. ดูใน Supabase Dashboard**
- ไปที่: https://supabase.com/dashboard/project/ttfjapfdzrxmbxbarfbn/functions
- จะเห็น functions ทั้งหมดที่ deploy แล้ว

---

## 🔗 **URL Pattern**

### **Production (Cloud)**
```
https://ttfjapfdzrxmbxbarfbn.supabase.co/functions/v1/{function-name}
```

### **Local Development**
```
http://localhost:54321/functions/v1/{function-name}
```

---

## 📝 **หมายเหตุ**

- ✅ **Frontend ใช้ Edge Functions ทั้งหมดแล้ว** (ไม่ใช้ Local API)
- ✅ **Local API (`api/endpoints/`)** ใช้สำหรับ Development เท่านั้น
- ✅ **Edge Functions** เป็น API จริงที่ใช้ใน Production

---

**อ้างอิง:**
- Local API: `api/README.md` (Development only)
- Edge Functions: `supabase/functions/` (Production)

