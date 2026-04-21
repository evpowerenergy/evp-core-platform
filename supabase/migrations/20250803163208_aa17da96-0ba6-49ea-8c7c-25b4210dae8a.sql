-- สร้าง immutable function สำหรับแปลงเวลาไทย
CREATE OR REPLACE FUNCTION add_thailand_offset(ts TIMESTAMPTZ)
RETURNS TIMESTAMPTZ 
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT ts + INTERVAL '7 hours';
$$;

-- ลบ computed columns เดิม  
ALTER TABLE leads 
DROP COLUMN IF EXISTS created_at_thai,
DROP COLUMN IF EXISTS updated_at_thai;

ALTER TABLE users 
DROP COLUMN IF EXISTS created_at_thai,
DROP COLUMN IF EXISTS updated_at_thai;

ALTER TABLE lead_productivity_logs 
DROP COLUMN IF EXISTS created_at_thai;

-- สร้าง computed columns ใหม่ด้วย function
ALTER TABLE leads 
ADD COLUMN created_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (add_thailand_offset(created_at)) STORED,
ADD COLUMN updated_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (add_thailand_offset(updated_at)) STORED;

ALTER TABLE users 
ADD COLUMN created_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (add_thailand_offset(created_at)) STORED,
ADD COLUMN updated_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (add_thailand_offset(updated_at)) STORED;

ALTER TABLE lead_productivity_logs 
ADD COLUMN created_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (add_thailand_offset(created_at)) STORED;