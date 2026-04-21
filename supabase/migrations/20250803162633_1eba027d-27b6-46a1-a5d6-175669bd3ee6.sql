-- แก้ไข computed columns ให้เป็นเวลาไทยที่ถูกต้อง
-- ใช้วิธีการเพิ่มเวลาด้วย extract epoch แล้วเพิ่ม 7*3600 วินาที

-- ลบ computed columns เดิมที่ผิด
ALTER TABLE leads 
DROP COLUMN IF EXISTS created_at_thai,
DROP COLUMN IF EXISTS updated_at_thai;

ALTER TABLE users 
DROP COLUMN IF EXISTS created_at_thai,
DROP COLUMN IF EXISTS updated_at_thai;

ALTER TABLE lead_productivity_logs 
DROP COLUMN IF EXISTS created_at_thai;

-- สร้าง computed columns ใหม่ที่ถูกต้อง (เพิ่ม 7 ชั่วโมง = 25200 วินาที)
ALTER TABLE leads 
ADD COLUMN created_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (created_at + '7 hours'::INTERVAL) STORED,
ADD COLUMN updated_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (updated_at + '7 hours'::INTERVAL) STORED;

ALTER TABLE users 
ADD COLUMN created_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (created_at + '7 hours'::INTERVAL) STORED,
ADD COLUMN updated_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (updated_at + '7 hours'::INTERVAL) STORED;

ALTER TABLE lead_productivity_logs 
ADD COLUMN created_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (created_at + '7 hours'::INTERVAL) STORED;