-- สร้าง indexes สำหรับ Thai timezone columns เพื่อประสิทธิภาพการ query
-- เนื่องจากมี indexes บน created_at อยู่แล้ว ควรมีบน created_at_thai ด้วย

-- Index สำหรับ leads table
CREATE INDEX idx_leads_created_at_thai_desc 
ON public.leads USING btree (created_at_thai DESC);

CREATE INDEX idx_leads_updated_at_thai_desc 
ON public.leads USING btree (updated_at_thai DESC);

-- Index สำหรับ users table  
CREATE INDEX idx_users_created_at_thai_desc 
ON public.users USING btree (created_at_thai DESC);

CREATE INDEX idx_users_updated_at_thai_desc 
ON public.users USING btree (updated_at_thai DESC);

-- Index สำหรับ lead_productivity_logs table
CREATE INDEX idx_logs_created_at_thai_desc 
ON public.lead_productivity_logs USING btree (created_at_thai DESC);

-- Composite indexes ที่มีประโยชน์สำหรับการ filter
CREATE INDEX idx_leads_status_created_at_thai 
ON public.leads USING btree (status, created_at_thai DESC);

CREATE INDEX idx_leads_category_platform_created_at_thai 
ON public.leads USING btree (category, platform, created_at_thai DESC);