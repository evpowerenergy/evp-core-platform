-- แก้ไข computed columns ให้บวก 7 ชั่วโมงจริงๆ
ALTER TABLE leads 
DROP COLUMN created_at_thai,
DROP COLUMN updated_at_thai;

ALTER TABLE users 
DROP COLUMN created_at_thai,
DROP COLUMN updated_at_thai;

ALTER TABLE lead_productivity_logs 
DROP COLUMN created_at_thai;

-- สร้างใหม่ด้วยการบวก interval โดยตรง (ใช้ UTC timestamp)
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