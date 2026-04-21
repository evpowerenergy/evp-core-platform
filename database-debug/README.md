# 🔍 Database Debug & Analysis Tools

> **เครื่องมือสำหรับวิเคราะห์และ debug ข้อมูลใน Supabase Database**

## 📁 โครงสร้างโฟลเดอร์

```
database-debug/
├── scripts/           # Scripts สำหรับ query และวิเคราะห์ข้อมูล
├── reports/           # รายงานผลการวิเคราะห์
├── queries/           # SQL queries ที่ใช้บ่อย
└── backups/           # ข้อมูลสำรอง
```

## 🛠️ เครื่องมือที่มี

### 📊 **Scripts หลัก**

| ไฟล์ | วัตถุประสงค์ | การใช้งาน |
|------|-------------|----------|
| `search-customer.js` | ค้นหาข้อมูลลูกค้า | `node search-customer.js` |
| `database-structure.js` | วิเคราะห์โครงสร้าง database | `node database-structure.js` |
| `analyze-database.js` | วิเคราะห์ข้อมูลแบบละเอียด | `node analyze-database.js` |

### 🔍 **การใช้งาน**

#### 1. ค้นหาข้อมูลลูกค้า
```bash
cd database-debug/scripts
node search-customer.js
```

#### 2. วิเคราะห์โครงสร้าง Database
```bash
cd database-debug/scripts
node database-structure.js
```

#### 3. วิเคราะห์ข้อมูลแบบละเอียด
```bash
cd database-debug/scripts
node analyze-database.js
```

## 📋 **ข้อมูลที่ได้**

### 🏢 **ตารางหลัก**
- **customer_services**: 446 รายการ
- **users**: 35 รายการ
- **permit_requests**: 455 รายการ
- **resources**: 11 รายการ

### 📊 **สถิติสำคัญ**
- **จังหวัด**: เชียงใหม่ (265), กรุงเทพฯ (29), ลำพูน (24)
- **Service Visits**: Visit 1 (312), Visit 2 (160), Visit 3 (1)
- **สถานะ**: Active (446 รายการ)

## 🔧 **การแก้ไข Scripts**

### เพิ่มการค้นหาใหม่
```javascript
// ใน search-customer.js
const { data, error } = await supabase
  .from('customer_services')
  .select('*')
  .ilike('customer_group', '%ชื่อที่ต้องการ%');
```

### เพิ่มการวิเคราะห์ใหม่
```javascript
// ใน database-structure.js
const { data, error } = await supabase
  .from('ตารางที่ต้องการ')
  .select('*')
  .limit(10);
```

## 📝 **การสร้างรายงาน**

### 1. สร้างรายงานใหม่
```bash
cd database-debug/reports
touch report-$(date +%Y%m%d).md
```

### 2. บันทึกผลการวิเคราะห์
```bash
node database-structure.js > reports/analysis-$(date +%Y%m%d).txt
```

## 🚀 **การใช้งานขั้นสูง**

### 1. วิเคราะห์ข้อมูลตามเงื่อนไข
```javascript
// ค้นหาลูกค้าที่มี Service Visit 3
const { data, error } = await supabase
  .from('customer_services')
  .select('*')
  .eq('service_visit_3', true);
```

### 2. วิเคราะห์ข้อมูลตามจังหวัด
```javascript
// ค้นหาลูกค้าในจังหวัดเชียงใหม่
const { data, error } = await supabase
  .from('customer_services')
  .select('*')
  .eq('province', 'เชียงใหม่');
```

### 3. วิเคราะห์ข้อมูลตามวันที่
```javascript
// ค้นหาลูกค้าที่ติดตั้งในเดือนนี้
const { data, error } = await supabase
  .from('customer_services')
  .select('*')
  .gte('installation_date', '2025-10-01');
```

## 🔒 **ความปลอดภัย**

- ใช้ **anon key** (read-only)
- ไม่แก้ไขข้อมูล
- แค่ query ข้อมูล
- ปลอดภัยสำหรับ production

## ⚙️ **การตั้งค่า Environment Variables**

### 1. สร้างไฟล์ .env
```bash
cd database-debug/scripts
cp env.example .env
```

### 2. แก้ไขไฟล์ .env
```bash
# ใส่ค่าจริงของ Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. ตรวจสอบการตั้งค่า
```bash
node config.js
```

## 🔍 **ที่มาของ Supabase Credentials**

### **Hardcoded Values (Fallback)**
- มาจาก `src/config.ts` ในโปรเจคหลัก
- ใช้เมื่อไม่มี environment variables
- ปลอดภัยเพราะเป็น anon key (read-only)

### **Environment Variables**
- ใช้ `VITE_SUPABASE_URL` และ `VITE_SUPABASE_ANON_KEY`
- อ่านจากไฟล์ `.env` หรือ system environment
- แนะนำสำหรับ production

## 📞 **การช่วยเหลือ**

### ปัญหาที่พบบ่อย
1. **Connection Error**: ตรวจสอบ URL และ Key
2. **Permission Denied**: ตรวจสอบ RLS policies
3. **No Data**: ตรวจสอบชื่อตารางและคอลัมน์

### การ Debug
```javascript
// เพิ่ม error handling
if (error) {
  console.error('❌ เกิดข้อผิดพลาด:', error);
  return;
}
```

## 🎯 **ตัวอย่างการใช้งาน**

### ค้นหาลูกค้าชื่อ "ฟอนดี้"
```bash
node search-customer.js
# ผลลัพธ์: พบ 4 รายการ
```

### วิเคราะห์โครงสร้าง Database
```bash
node database-structure.js
# ผลลัพธ์: 446 ลูกค้า, 35 ผู้ใช้, 455 คำขออนุญาต
```

### วิเคราะห์ข้อมูลแบบละเอียด
```bash
node analyze-database.js
# ผลลัพธ์: สถิติครบถ้วน
```

---

**🎉 พร้อมใช้งาน!** - ง่าย รวดเร็ว ปลอดภัย
