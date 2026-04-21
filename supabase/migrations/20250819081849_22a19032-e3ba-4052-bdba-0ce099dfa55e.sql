-- Enable Supabase Realtime for leads table
-- ขั้นตอนที่ 1: ตั้งค่า REPLICA IDENTITY เป็น FULL เพื่อให้ส่งข้อมูลแถวทั้งหมดเมื่อมีการเปลี่ยนแปลง
ALTER TABLE public.leads REPLICA IDENTITY FULL;

-- ขั้นตอนที่ 2: เพิ่มตาราง leads เข้าไปในการ publication ของ supabase_realtime
ALTER publication supabase_realtime ADD TABLE public.leads;