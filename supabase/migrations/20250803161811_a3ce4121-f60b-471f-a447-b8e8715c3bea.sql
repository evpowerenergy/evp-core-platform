-- เพิ่ม computed columns สำหรับเวลาไทย (+7) ใน tables สำคัญ

-- สำหรับ leads table
ALTER TABLE leads 
ADD COLUMN created_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok') STORED,
ADD COLUMN updated_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok') STORED;

-- สำหรับ users table  
ALTER TABLE users 
ADD COLUMN created_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok') STORED,
ADD COLUMN updated_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok') STORED;

-- สำหรับ lead_productivity_logs table
ALTER TABLE lead_productivity_logs 
ADD COLUMN created_at_thai TIMESTAMPTZ 
GENERATED ALWAYS AS (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok') STORED;

-- เพิ่ม indexes สำหรับ performance ในการ filter วันที่
CREATE INDEX idx_leads_created_at_thai ON leads(created_at_thai);
CREATE INDEX idx_leads_updated_at_thai ON leads(updated_at_thai);
CREATE INDEX idx_users_created_at_thai ON users(created_at_thai);
CREATE INDEX idx_users_updated_at_thai ON users(updated_at_thai);
CREATE INDEX idx_lead_productivity_logs_created_at_thai ON lead_productivity_logs(created_at_thai);