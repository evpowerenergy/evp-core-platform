# 📅 Date Filter Pattern Migration Guide

## 🎯 **หลักการ: Date Filter เป็นหลัก, Limit เป็น Fallback**

### **แนวทางปฏิบัติ (Best Practice):**
1. ✅ **Date Filter เป็นหลัก** - เมื่อมี Date Filter → ไม่ใช้ Limit
2. ⚠️ **Limit เป็น Fallback** - เมื่อไม่มี Date Filter → ใช้ Limit เพื่อป้องกัน

---

## ✅ **API ที่ปรับปรุงแล้ว**

### **1. leads-for-dashboard.ts** ✅
- ✅ รองรับ `from` และ `to` parameters
- ✅ ใช้ Date Filter เป็นหลัก (ไม่ใช้ limit เมื่อมี date filter)
- ✅ ใช้ limit เฉพาะเมื่อไม่มี date filter (default: 5000)
- **Frontend:** `src/pages/Index.tsx`

### **2. leads-optimized.ts** ✅
- ✅ รองรับ `from` และ `to` parameters
- ✅ ใช้ Date Filter เป็นหลัก (ไม่ใช้ limit เมื่อมี date filter)
- ✅ ใช้ limit เฉพาะเมื่อไม่มี date filter (default: 50)
- **Frontend:** `src/hooks/useLeadsOptimizedAPI.ts` (ต้องอัพเดท)

### **3. sales-team-data.ts** ✅ (มี Date Filter แล้ว)
- ✅ รองรับ `from`, `to`, `dateFrom`, `dateTo`, `dateRange`
- ✅ ใช้ Date Filter เป็นหลัก (ไม่มี limit)
- **Frontend:** `src/hooks/useAppDataAPI.ts`

### **4. service-appointments.ts** ✅ (มี Date Filter แล้ว)
- ✅ รองรับ `date`, `startDate`, `endDate` สำหรับ list
- ✅ รองรับ `year`, `month` สำหรับ monthly
- ✅ ใช้ Date Filter เป็นหลัก (ไม่มี limit)
- **Frontend:** `src/hooks/useServiceAppointmentsAPI.ts`

---

## 📝 **โครงสร้าง Pattern ที่ใช้**

### **API Endpoint Pattern:**
```typescript
// 1. Parse query parameters
const dateFrom = queryParams.get('from');
const dateTo = queryParams.get('to');
const limit = queryParams.get('limit');

// 2. Build query
let query = supabase
  .from('table_name')
  .select('*')
  .order('created_at_thai', { ascending: false });

// 3. Apply date filter if provided (priority over limit)
if (dateFrom && dateTo) {
  query = query
    .gte('created_at_thai', dateFrom)
    .lte('created_at_thai', dateTo);
  // ✅ ไม่ต้อง limit เมื่อมี Date Filter - ให้ดึงข้อมูลทั้งหมดในช่วงวันที่
} else if (limit) {
  // ⚠️ Fallback: ถ้าไม่มี Date Filter → ใช้ limit เพื่อป้องกัน
  query = query.limit(parseInt(limit));
} else {
  // ⚠️ Safety: ถ้าไม่มีทั้ง Date Filter และ limit → ใช้ default limit
  query = query.limit(defaultLimit);
}
```

### **Frontend Hook Pattern:**
```typescript
const params = new URLSearchParams();

// Apply date range filter if provided
if (dateRangeFilter && dateRangeFilter.from) {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const startDateString = formatter.format(dateRangeFilter.from);
  const startString = startDateString + 'T00:00:00.000';
  
  const endDateString = formatter.format(dateRangeFilter.to || dateRangeFilter.from);
  const endString = endDateString + 'T23:59:59.999';
  
  params.append('from', startString);
  params.append('to', endString);
  // ✅ ไม่ส่ง limit เมื่อมี Date Filter - ให้ดึงข้อมูลทั้งหมดในช่วงวันที่
} else {
  // ⚠️ Fallback: ถ้าไม่มี Date Filter → ใช้ limit เพื่อป้องกัน
  params.append('limit', '5000');
}
```

---

## 🔄 **API ที่ควรปรับปรุงเพิ่ม**

### **Priority 1: Leads APIs (มี limit แต่ไม่มี date filter)**
- [ ] `leads-list.ts` - Limit: 100 → เพิ่ม date filter
- [ ] `leads.ts` - Limit: 100 → เพิ่ม date filter
- [ ] `lead-management.ts` - Optional limit → เพิ่ม date filter
- [ ] `leads-complete.ts` - Limit: 100 → เพิ่ม date filter

### **Priority 2: Inventory APIs (ถ้าจำเป็น)**
- [ ] `inventory.ts` - Limit: 1000 → พิจารณาเพิ่ม date filter (ถ้าเหมาะสม)
- [ ] `products-management.ts` - Limit: 1000 → พิจารณาเพิ่ม date filter (ถ้าเหมาะสม)

### **Priority 3: Customer Services (ถ้าจำเป็น)**
- [ ] `customer-services.ts` - ไม่มี limit, ไม่มี date filter → พิจารณาเพิ่ม date filter (ถ้าต้องการ)

---

## 🚀 **ขั้นตอนการ Migrate API อื่นๆ**

### **Step 1: วิเคราะห์ API**
```bash
# ตรวจสอบ API ที่มี limit
grep -r "\.limit(" api/endpoints/
```

### **Step 2: ปรับ API Endpoint**
1. เพิ่มการ parse `from` และ `to` parameters
2. เพิ่ม date filter logic (`.gte()` และ `.lte()`)
3. ปรับ limit logic ให้ใช้เป็น fallback
4. อัพเดท response meta เพื่อแสดง date filter และ limit status

### **Step 3: ปรับ Frontend Hook**
1. เพิ่ม date filter parameter ใน hook
2. Format date เป็น ISO string (Thai timezone)
3. ส่ง date filter parameters แทน limit เมื่อมี date filter
4. อัพเดท queryKey เพื่อรวม date filter

### **Step 4: ทดสอบ**
1. ทดสอบด้วย date filter → ควรดึงข้อมูลทั้งหมดในช่วงวันที่
2. ทดสอบโดยไม่มี date filter → ควรใช้ limit
3. ตรวจสอบประสิทธิภาพการ query

---

## 📊 **ตัวอย่างการใช้งาน**

### **Frontend: ส่ง Date Filter**
```typescript
// ✅ มี Date Filter → ไม่ส่ง limit
fetch('/api/endpoints/core/leads/leads-optimized?from=2024-01-01T00:00:00.000&to=2024-01-31T23:59:59.999')

// ⚠️ ไม่มี Date Filter → ส่ง limit
fetch('/api/endpoints/core/leads/leads-optimized?limit=50')
```

### **API Response: แสดง Meta**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "dateFrom": "2024-01-01T00:00:00.000",
    "dateTo": "2024-01-31T23:59:59.999",
    "limit": null,  // ← null เมื่อมี date filter
    "totalRecords": 1234
  }
}
```

---

## ⚠️ **ข้อควรระวัง**

### **1. Date Format**
- ใช้ ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sss`
- ใช้ Thai timezone สำหรับ formatting
- เริ่มต้น 00:00:00.000 และสิ้นสุด 23:59:59.999

### **2. Performance**
- Date Filter ที่ Database Level มีประสิทธิภาพดีกว่า Frontend Filter
- ควรใช้ Index สำหรับ `created_at_thai` column
- ตรวจสอบ execution time ใน meta response

### **3. Backward Compatibility**
- ต้องรองรับ API calls ที่ยังส่ง limit อยู่ (fallback)
- ต้องรองรับ API calls ที่ไม่ส่งทั้ง date filter และ limit (default limit)

---

## ✅ **สรุป**

**หลักการสำคัญ:**
- 📅 **Date Filter = หลัก** → ดึงข้อมูลทั้งหมดในช่วงวันที่
- 🔢 **Limit = Fallback** → ป้องกันเมื่อไม่มี date filter
- ⚡ **Performance = Database Level** → ไม่ filter ที่ frontend

**ประโยชน์:**
- ✅ ดึงข้อมูลครบถ้วนตามช่วงวันที่
- ✅ ประสิทธิภาพดีขึ้น (filter ที่ database)
- ✅ ยืดหยุ่น (รองรับทั้งมีและไม่มี date filter)
- ✅ ปลอดภัย (มี fallback limit)

---

**อัพเดทล่าสุด:** 2025-10-29

