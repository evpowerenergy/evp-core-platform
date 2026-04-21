-- เพิ่ม Thai time columns สำหรับตารางที่สำคัญ

-- 1. appointments table
ALTER TABLE appointments 
ADD COLUMN date_thai TIMESTAMPTZ;

-- 2. bookings table  
ALTER TABLE bookings 
ADD COLUMN created_at_thai TIMESTAMPTZ,
ADD COLUMN start_time_thai TIMESTAMPTZ,
ADD COLUMN end_time_thai TIMESTAMPTZ;

-- 3. conversations table
ALTER TABLE conversations 
ADD COLUMN created_at_thai TIMESTAMPTZ;

-- 4. lead_productivity_logs - เพิ่ม next_follow_up_thai
ALTER TABLE lead_productivity_logs 
ADD COLUMN next_follow_up_thai TIMESTAMPTZ;

-- 5. office_equipment table
ALTER TABLE office_equipment 
ADD COLUMN created_at_thai TIMESTAMPTZ,
ADD COLUMN updated_at_thai TIMESTAMPTZ;

-- 6. platforms table
ALTER TABLE platforms 
ADD COLUMN created_at_thai TIMESTAMPTZ,
ADD COLUMN updated_at_thai TIMESTAMPTZ;

-- 7. products table
ALTER TABLE products 
ADD COLUMN created_at_thai TIMESTAMPTZ,
ADD COLUMN updated_at_thai TIMESTAMPTZ;

-- 8. quotations table
ALTER TABLE quotations 
ADD COLUMN estimate_payment_date_thai TIMESTAMPTZ;

-- 9. resources table
ALTER TABLE resources 
ADD COLUMN created_at_thai TIMESTAMPTZ;

-- 10. sales_team_with_user_info table
ALTER TABLE sales_team_with_user_info 
ADD COLUMN created_at_thai TIMESTAMPTZ,
ADD COLUMN updated_at_thai TIMESTAMPTZ;