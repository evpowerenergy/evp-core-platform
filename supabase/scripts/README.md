# SQL Scripts Directory

โฟลเดอร์นี้เก็บ SQL scripts ต่างๆ ที่ใช้สำหรับตรวจสอบ, แก้ไข, และจัดการข้อมูลในฐานข้อมูล

## 📁 โครงสร้างโฟลเดอร์

### `check/` - ตรวจสอบข้อมูล
SQL queries สำหรับตรวจสอบและวิเคราะห์ข้อมูล
- `CHECK_LEADS_SALE_OWNER_VS_POST_SALES_OWNER.sql` - ตรวจสอบ leads ที่ sale owner กับ post sales owner ไม่ตรงกัน
- `CHECK_LEADS_SALE_OWNER_VS_PRODUCTIVITY_LOGS_SALE_ID.sql` - ตรวจสอบความสอดคล้องของ sale ID
- `CHECK_SALE_FOLLOW_UP_STATS.sql` - ตรวจสอบสถิติ sale follow-up
- `CHECK_LEADS_STATUS_INCONSISTENCY.sql` - ตรวจสอบ leads ที่มี sale_owner_id แต่ status = "รอรับ" (ข้อมูลไม่สอดคล้องกัน)
- และอื่นๆ

### `fix/` - แก้ไขข้อมูล
SQL queries สำหรับแก้ไขและปรับปรุงข้อมูลที่มีปัญหา
- `FIX_ALL_18_FINAL.sql` - แก้ไข 18 รายการที่ขาด post_sales_owner_id
- `FIX_ROLE_UPDATE_FINAL.sql` - แก้ไข role system
- `FIX_PRODUCTIVITY_LOGS_SALE_ID_USE_LEAD_SALE_OWNER.sql` - แก้ไข sale ID ใน productivity logs
- `FIX_LEADS_STATUS_INCONSISTENCY.sql` - แก้ไข leads ที่มี sale_owner_id แต่ status = "รอรับ" (ข้อมูลไม่สอดคล้องกัน)
- และอื่นๆ

### `update/` - อัปเดตข้อมูล
SQL queries สำหรับอัปเดตข้อมูลและ schema
- `UPDATE_CREATE_LEAD_FUNCTION_USE_SALE_OWNER_ID.sql` - อัปเดต function สำหรับสร้าง lead
- `UPDATE_CUSTOMER_SERVICES_EXTENDED.sql` - อัปเดต customer services
- `UPDATE_SALE_FOLLOW_UP_ASSIGNED_TO.sql` - อัปเดต sale follow-up
- และอื่นๆ

### `create/` - สร้างข้อมูล
SQL queries สำหรับสร้างข้อมูลใหม่
- `CREATE_LEADS_FOR_3.sql` - สร้าง leads สำหรับ 3 รายการ
- `CREATE_LEADS_FOR_3_DIRECT.sql` - สร้าง leads โดยตรง
- และอื่นๆ

### `run/` - Scripts สำหรับรันใน Supabase UI
SQL queries ที่เตรียมไว้สำหรับรันใน Supabase SQL Editor
- `RUN_IN_SUPABASE_UI.sql` - Query สำหรับรันใน Supabase UI
- `RUN_TRIGGER_SET_SALE_ID_IN_SUPABASE_UI.sql` - รัน trigger
- `APPLY_THIS_QUERY.sql` - Query สำหรับ apply
- `QUERY_FOR_SUPABASE_UI.sql` - Query สำหรับ Supabase UI
- `INVESTIGATE_MISSING_15.sql` - ตรวจสอบข้อมูลที่หายไป
- และอื่นๆ

### `test/` - ทดสอบ
SQL queries สำหรับทดสอบและ debug
- `TEST_QUERIES.sql` - Queries ตัวอย่างสำหรับทดสอบ
- `TEST_TRIGGER.sql` - ทดสอบ trigger
- และอื่นๆ

### `verify/` - ตรวจสอบผลลัพธ์
SQL queries สำหรับตรวจสอบผลลัพธ์หลังจากการแก้ไข
- `VERIFY_BACKFILL_QUERY.sql` - ตรวจสอบ backfill
- `VERIFY_TRIGGER_SET_SALE_ID.sql` - ตรวจสอบ trigger
- และอื่นๆ

### `alter/` - แก้ไข Schema
SQL queries สำหรับแก้ไข database schema
- `ALTER_VIEW_APPROACH.sql` - แก้ไข view
- และอื่นๆ

## 📝 วิธีใช้งาน

### 1. ตรวจสอบข้อมูล
```sql
-- เปิดไฟล์ใน check/ และรันใน Supabase SQL Editor
```

### 2. แก้ไขข้อมูล
```sql
-- 1. ตรวจสอบข้อมูลก่อน (ใช้ queries ใน check/)
-- 2. รัน fix queries ใน fix/
-- 3. ตรวจสอบผลลัพธ์ (ใช้ queries ใน verify/)
```

### 3. อัปเดต Schema
```sql
-- ใช้ queries ใน update/ หรือ alter/
-- ควร backup ข้อมูลก่อน
```

## ⚠️ คำเตือน

- **Backup ข้อมูลก่อนรัน** - queries บางตัวอาจแก้ไขข้อมูลถาวร
- **ทดสอบใน Development ก่อน** - อย่ารัน queries ที่แก้ไขข้อมูลใน Production โดยตรง
- **ตรวจสอบผลลัพธ์** - ใช้ queries ใน `verify/` เพื่อตรวจสอบผลลัพธ์
- **อ่าน comments** - แต่ละไฟล์มี comments อธิบายวัตถุประสงค์

## 🔄 Migration vs Scripts

- **`migrations/`** - ใช้สำหรับ schema changes ที่ต้องการ version control
- **`scripts/`** - ใช้สำหรับ one-time fixes, data checks, และ maintenance queries

---

**หมายเหตุ:** ไฟล์เหล่านี้ถูกย้ายมาจาก root ของ `supabase/` เพื่อให้โครงสร้างโปรเจคเป็นระเบียบมากขึ้น

