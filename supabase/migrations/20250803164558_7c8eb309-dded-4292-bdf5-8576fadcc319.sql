-- ลบ computed columns ที่มีปัญหา
ALTER TABLE leads 
DROP COLUMN IF EXISTS created_at_thai,
DROP COLUMN IF EXISTS updated_at_thai;

ALTER TABLE users 
DROP COLUMN IF EXISTS created_at_thai,
DROP COLUMN IF EXISTS updated_at_thai;

ALTER TABLE lead_productivity_logs 
DROP COLUMN IF EXISTS created_at_thai;

-- เพิ่ม columns ธรรมดา
ALTER TABLE leads 
ADD COLUMN created_at_thai TIMESTAMPTZ,
ADD COLUMN updated_at_thai TIMESTAMPTZ;

ALTER TABLE users 
ADD COLUMN created_at_thai TIMESTAMPTZ,
ADD COLUMN updated_at_thai TIMESTAMPTZ;

ALTER TABLE lead_productivity_logs 
ADD COLUMN created_at_thai TIMESTAMPTZ;

-- สร้าง function สำหรับคำนวณเวลาไทย
CREATE OR REPLACE FUNCTION update_thailand_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
  
  IF TG_TABLE_NAME IN ('leads', 'users') THEN
    NEW.updated_at_thai := NEW.updated_at + INTERVAL '7 hours';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง triggers
CREATE TRIGGER update_leads_thai_time
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();

CREATE TRIGGER update_users_thai_time
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();

CREATE TRIGGER update_logs_thai_time
  BEFORE INSERT OR UPDATE ON lead_productivity_logs
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();

-- อัพเดทข้อมูลเดิม
UPDATE leads SET updated_at = updated_at;
UPDATE users SET updated_at = updated_at;
UPDATE lead_productivity_logs SET created_at = created_at;