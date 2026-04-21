-- ลบ column เก่าที่มี DEFAULT value
ALTER TABLE appointments 
DROP COLUMN IF EXISTS appointment_type;

-- เพิ่ม column ใหม่โดยไม่มี DEFAULT value
ALTER TABLE appointments 
ADD COLUMN appointment_type VARCHAR(50);

-- เพิ่ม comment สำหรับ field ใหม่
COMMENT ON COLUMN appointments.appointment_type IS 'ประเภทของนัดหมาย: follow-up, engineer, payment';