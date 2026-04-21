-- เพิ่ม tables ที่ขาดหายไปเข้าไปใน supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_productivity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_team_with_user_info;

-- ตรวจสอบอีกครั้งว่า tables ทั้งหมดอยู่ใน publication แล้ว
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;