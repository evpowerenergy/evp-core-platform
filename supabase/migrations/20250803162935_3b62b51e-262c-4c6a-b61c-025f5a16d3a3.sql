-- ลบ computed columns เดิม
ALTER TABLE leads 
DROP COLUMN IF EXISTS created_at_thai,
DROP COLUMN IF EXISTS updated_at_thai;

ALTER TABLE users 
DROP COLUMN IF EXISTS created_at_thai,
DROP COLUMN IF EXISTS updated_at_thai;

ALTER TABLE lead_productivity_logs 
DROP COLUMN IF EXISTS created_at_thai;

-- สร้าง computed columns ใหม่แบบ immutable (เพิ่ม 25200 วินาที = 7 ชั่วโมง)
ALTER TABLE leads 
ADD COLUMN created_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (TO_TIMESTAMP(EXTRACT(EPOCH FROM created_at) + 25200)) STORED,
ADD COLUMN updated_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (TO_TIMESTAMP(EXTRACT(EPOCH FROM updated_at) + 25200)) STORED;

ALTER TABLE users 
ADD COLUMN created_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (TO_TIMESTAMP(EXTRACT(EPOCH FROM created_at) + 25200)) STORED,
ADD COLUMN updated_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (TO_TIMESTAMP(EXTRACT(EPOCH FROM updated_at) + 25200)) STORED;

ALTER TABLE lead_productivity_logs 
ADD COLUMN created_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (TO_TIMESTAMP(EXTRACT(EPOCH FROM created_at) + 25200)) STORED;