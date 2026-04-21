-- เพิ่ม column สำหรับเก็บขนาด kW ที่ลูกค้าสนใจ
ALTER TABLE public.lead_productivity_logs 
ADD COLUMN interested_kw_size text;