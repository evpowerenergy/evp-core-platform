-- =============================================================================
-- Migration 1: เพิ่ม field post_sales_owner_id ใน table leads
-- =============================================================================
-- 
-- วัตถุประสงค์: เพิ่ม field ใหม่เพื่อแยก sale ที่ปิดการขาย (sale_owner_id) 
-- กับ sale ที่ติดตามหลังการขาย (post_sales_owner_id)
--
-- ตามแนวทางที่ 1 จาก SALE_FOLLOW_UP_ASSIGNMENT_ISSUE.md
-- =============================================================================

-- เพิ่ม field post_sales_owner_id
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS post_sales_owner_id INTEGER;

-- Foreign key constraint
ALTER TABLE public.leads
ADD CONSTRAINT fk_leads_post_sales_owner_id
FOREIGN KEY (post_sales_owner_id)
REFERENCES sales_team_with_user_info(id)
ON DELETE SET NULL;

-- Index สำหรับ performance (เฉพาะ records ที่มี post_sales_owner_id)
CREATE INDEX IF NOT EXISTS idx_leads_post_sales_owner_id 
ON leads(post_sales_owner_id) 
WHERE post_sales_owner_id IS NOT NULL;

-- Comment สำหรับ documentation
COMMENT ON COLUMN public.leads.post_sales_owner_id IS 
'Sale ที่รับผิดชอบติดตามหลังการขาย (จาก customer_services.sale_follow_up_assigned_to). แยกจาก sale_owner_id (ที่ปิดการขาย)';

-- =============================================================================
-- ✅ เสร็จสิ้น Migration 1: เพิ่ม field แล้ว
-- =============================================================================
-- 
-- ขั้นตอนต่อไป:
-- 1. Migration 2: อัปเดตข้อมูลจาก sale_follow_up_assigned_to มาใส่ใน post_sales_owner_id
-- 2. Migration 3: แก้ไข function create_lead_from_customer_service()
-- =============================================================================
