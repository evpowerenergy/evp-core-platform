-- แก้ไข computed columns ให้เป็นเวลาไทยที่ถูกต้อง (+7 ชั่วโมง)

-- ลบ computed columns เดิมที่ผิด
ALTER TABLE leads 
DROP COLUMN IF EXISTS created_at_thai,
DROP COLUMN IF EXISTS updated_at_thai;

ALTER TABLE users 
DROP COLUMN IF EXISTS created_at_thai,
DROP COLUMN IF EXISTS updated_at_thai;

ALTER TABLE lead_productivity_logs 
DROP COLUMN IF EXISTS created_at_thai;

-- สร้าง computed columns ใหม่ที่ถูกต้อง (เพิ่ม 7 ชั่วโมง)
ALTER TABLE leads 
ADD COLUMN created_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (created_at + INTERVAL '7 hours') STORED,
ADD COLUMN updated_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (updated_at + INTERVAL '7 hours') STORED;

ALTER TABLE users 
ADD COLUMN created_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (created_at + INTERVAL '7 hours') STORED,
ADD COLUMN updated_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (updated_at + INTERVAL '7 hours') STORED;

ALTER TABLE lead_productivity_logs 
ADD COLUMN created_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (created_at + INTERVAL '7 hours') STORED;

-- สร้าง indexes ใหม่
CREATE INDEX idx_leads_created_at_thai ON leads(created_at_thai);
CREATE INDEX idx_leads_updated_at_thai ON leads(updated_at_thai);
CREATE INDEX idx_users_created_at_thai ON users(created_at_thai);
CREATE INDEX idx_users_updated_at_thai ON users(updated_at_thai);
CREATE INDEX idx_lead_productivity_logs_created_at_thai ON lead_productivity_logs(created_at_thai);