# 🔧 Migration: เพิ่มความยาว Fields ในตาราง Leads

## ⚠️ ปัญหาที่พบ

เมื่อเพิ่มลีดใหม่ เกิด error:
```
value too long for type character varying(20)
```

สาเหตุ: Fields `tel` และ `platform` ในตาราง `leads` จำกัดความยาวที่ **20 ตัวอักษร** ซึ่งสั้นเกินไป

## ✅ วิธีแก้ไข

### ⚠️ สำคัญ: Migration นี้ต้องจัดการ Generated Column

ตาราง `leads` มี generated column `has_contact_info` ที่ใช้ `tel` field ดังนั้นต้อง drop generated column ก่อน แล้วค่อย alter type และสร้าง generated column ใหม่

### ขั้นตอนที่ 1: Apply Migration ใน Supabase

1. เข้าไปที่ **Supabase Dashboard**
2. ไปที่ **SQL Editor**
3. คัดลอกและรัน SQL ด้านล่าง:

```sql
-- Step 1: Drop the generated column has_contact_info (if it exists)
-- This is necessary because we cannot alter the type of a column used by a generated column
ALTER TABLE public.leads 
DROP COLUMN IF EXISTS has_contact_info;

-- Step 2: Increase tel field from 20 to 50 characters
-- This allows for formatted phone numbers with spaces, dashes, extensions, etc.
ALTER TABLE public.leads 
ALTER COLUMN tel TYPE character varying(50);

-- Step 3: Increase platform field from 20 to 50 characters  
-- This allows for longer platform names
ALTER TABLE public.leads 
ALTER COLUMN platform TYPE character varying(50);

-- Step 4: Recreate the has_contact_info generated column
-- Logic: (tel IS NOT NULL AND tel != '') OR (line_id IS NOT NULL AND line_id != '')
ALTER TABLE public.leads 
ADD COLUMN has_contact_info BOOLEAN 
GENERATED ALWAYS AS (
  (tel IS NOT NULL AND tel != '') OR 
  (line_id IS NOT NULL AND line_id != '')
) STORED;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN public.leads.tel IS 'Phone number (up to 50 characters to support formatted numbers)';
COMMENT ON COLUMN public.leads.platform IS 'Platform/source of the lead (up to 50 characters)';
COMMENT ON COLUMN public.leads.has_contact_info IS 'Generated column: true if lead has tel or line_id contact information';
```

4. กด **Run** เพื่อ execute SQL

### ขั้นตอนที่ 2: Verify การเปลี่ยนแปลง

รัน query ตรวจสอบ:

```sql
SELECT 
    column_name, 
    data_type, 
    character_maximum_length 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'leads' 
    AND column_name IN ('tel', 'platform');
```

ผลลัพธ์ที่ถูกต้อง:
```
column_name | data_type         | character_maximum_length
------------|-------------------|-------------------------
tel         | character varying | 50
platform    | character varying | 50
```

## 📝 การเปลี่ยนแปลง

| Field    | ก่อน | หลัง | เหตุผล |
|----------|------|------|--------|
| `tel`    | varchar(20) | varchar(50) | รองรับเบอร์โทรที่มี format พิเศษ เช่น `(081) 234-5678 ext.123` |
| `platform` | varchar(20) | varchar(50) | รองรับชื่อ platform ที่ยาวขึ้น |

## 🛡️ มาตรการป้องกันเพิ่มเติม

ระบบได้เพิ่มการ validate และ clean ข้อมูลใน frontend แล้ว:

### 1. Input Validation
- เพิ่ม `maxLength={20}` ใน input field เบอร์โทร
- แสดง placeholder บอกความยาวสูงสุด

### 2. Data Cleaning (ก่อนบันทึก)
```typescript
// Clean phone number: ลบ spaces, dashes, parentheses
const cleanedTel = values.tel.replace(/[\s\-\(\)]/g, "").trim().substring(0, 20);

// Clean platform: trim and limit length  
const cleanedPlatform = values.platform.trim().substring(0, 20);
```

## ✅ หลังจาก Apply Migration

1. ✅ **ไม่มี error อีกต่อไป** - สามารถเพิ่มลีดได้ปกติ
2. ✅ **รองรับเบอร์โทรทุกรูปแบบ** - พื้นที่เก็บ 50 ตัวอักษร
3. ✅ **ปลอดภัย** - มี validation ทั้งใน frontend และ database

## 🔍 ทดสอบ

หลัง apply migration ลองเพิ่มลีดด้วยเบอร์โทร:
- `0812345678` ✅
- `081-234-5678` ✅  
- `(081) 234-5678` ✅
- `081 234 5678 ext. 123` ✅

---

**หมายเหตุ:** 
- Migration file ใหม่ที่จัดการ generated column อยู่ที่:
  `supabase/migrations/20250117000000_increase_leads_field_lengths_with_generated_column.sql`
- Migration file เก่า (`20251016000000_increase_leads_field_lengths.sql`) ถูก deprecate แล้วเพราะจะ error ถ้ามี generated column

