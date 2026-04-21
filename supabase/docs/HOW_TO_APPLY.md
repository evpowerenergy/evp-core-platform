# 📝 วิธีการ Apply SQL Query บน Supabase UI

> **⚠️ สำคัญ:** เราใช้ **DATABASE VIEW** แทน Generated Columns เพราะ PostgreSQL ไม่อนุญาตให้ใช้ `CURRENT_DATE` ใน Generated Columns

## ขั้นตอนที่ 1: เปิด Supabase Dashboard

1. ไปที่ https://supabase.com/dashboard
2. เลือก Project ของคุณ
3. คลิกที่เมนู **SQL Editor** ทางด้านซ้าย

## ขั้นตอนที่ 2: เปิดไฟล์ Query

1. เปิดไฟล์ `supabase/APPLY_THIS_QUERY.sql`
2. **คัดลอก SQL ทั้งหมด** (Ctrl+A, Ctrl+C)

## ขั้นตอนที่ 3: รัน Query

1. ใน SQL Editor ของ Supabase
2. **วาง SQL** ที่คัดลอกมา (Ctrl+V)
3. คลิกปุ่ม **"Run"** หรือกด **Ctrl+Enter**
4. รอจนเสร็จ (ควรใช้เวลาไม่กี่วินาที)

## ขั้นตอนที่ 4: ตรวจสอบผลลัพธ์

ด้านล่างจะแสดงผลลัพธ์:
```
✅ Success. No rows returned
```

และจะมี query ทดสอบแสดงข้อมูลตัวอย่าง 10 รายการ

## ขั้นตอนที่ 5: Refresh Types (สำหรับ Frontend)

รันคำสั่งนี้ใน Terminal:

```bash
npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

หรือถ้าใช้ local:
```bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## ขั้นตอนที่ 6: Restart Dev Server

```bash
# หยุด dev server (Ctrl+C)
# เริ่มใหม่
npm run dev
```

## 🧪 ทดสอบว่าใช้งานได้

### ทดสอบใน Supabase SQL Editor:

```sql
-- ดูข้อมูลลูกค้าที่บริการครบแล้ว และแสดงว่าครบไปกี่วัน
SELECT 
  customer_group,
  tel,
  installation_date,
  days_since_installation,
  days_after_service_complete,
  service_status_calculated
FROM customer_services_with_days
WHERE service_visit_1 = true 
  AND service_visit_2 = true
ORDER BY days_after_service_complete DESC
LIMIT 20;
```

### ทดสอบใน Frontend (Console):

```typescript
const { data } = await supabase
  .from('customer_services_with_days')  // ⚠️ เปลี่ยนเป็น VIEW
  .select('customer_group, days_after_service_complete, service_status_calculated')
  .eq('service_visit_1', true)
  .eq('service_visit_2', true)
  .limit(5);
  
console.log(data);
```

## ❓ Troubleshooting

### ปัญหา: "column already exists"

**วิธีแก้:** Query ใช้ `IF NOT EXISTS` อยู่แล้ว ไม่ต้องกังวล

### ปัญหา: "permission denied"

**วิธีแก้:** ตรวจสอบว่าคุณมีสิทธิ์ admin ใน Supabase project

### ปัญหา: Frontend ยังไม่เห็น VIEW ใหม่

**วิธีแก้:**
1. Refresh types (ขั้นตอนที่ 5)
2. Restart dev server (ขั้นตอนที่ 6)
3. เปลี่ยนจาก `customer_services` เป็น `customer_services_with_days`

### ปัญหา: ค่าเป็น NULL ทั้งหมด

**สาเหตุ:** ข้อมูล `installation_date` เป็น NULL

**ตรวจสอบ:**
```sql
SELECT COUNT(*) as total,
       COUNT(installation_date) as has_installation_date
FROM customer_services;
```

## 📊 ตัวอย่างข้อมูลที่ได้

| customer_group | days_since_installation | days_after_service_complete | service_status_calculated |
|----------------|-------------------------|----------------------------|---------------------------|
| บริษัท A       | 800                     | 70                         | service_complete          |
| บริษัท B       | 750                     | 20                         | service_complete          |
| บริษัท C       | 400                     | NULL                       | service_2_pending         |

## ✅ เรียบร้อย!

### 📌 วิธีใช้งาน VIEW:

**แทนที่:**
```typescript
// ❌ เดิม
.from('customer_services')

// ✅ ใหม่
.from('customer_services_with_days')
```

ตอนนี้คุณสามารถใช้ VIEW ใหม่นี้ใน:
- ✅ Sale Follow-up Dashboard
- ✅ Sale Follow-up Management
- ✅ Service Tracking
- ✅ Reports & Analytics
- ✅ Export ข้อมูล

### 🎯 ข้อดีของการใช้ VIEW:

- ✅ คำนวณแบบ Real-time ทุกครั้งที่ query
- ✅ ค่าอัปเดตอัตโนมัติทุกวัน
- ✅ ไม่ต้องกังวลเรื่อง immutability
- ✅ Performance ดี (มี indexes รองรับ)
- ✅ ใช้งานเหมือน table ธรรมดา

