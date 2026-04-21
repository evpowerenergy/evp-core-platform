-- =============================================================================
-- Migration: Update update_sales_team_current_leads_v2 to include post_sales_owner_id
-- =============================================================================
-- Purpose: แก้ไข database function update_sales_team_current_leads_v2() 
--          ให้รวมทั้ง sale_owner_id และ post_sales_owner_id ในการนับ current_leads
-- Date: 2024-11-05
-- =============================================================================

-- แก้ไข function update_sales_team_current_leads_v2() ให้รวม post_sales_owner_id
CREATE OR REPLACE FUNCTION public.update_sales_team_current_leads_v2(sales_member_id integer)
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
  lead_count integer;
BEGIN
  -- Count current active leads for this sales member
  -- รวมทั้ง sale_owner_id และ post_sales_owner_id เพื่อให้ current_leads แสดงจำนวน leads ที่ sale รับผิดชอบทั้งหมด
  SELECT COUNT(*) INTO lead_count
  FROM leads
  WHERE (sale_owner_id = sales_member_id OR post_sales_owner_id = sales_member_id)
  AND status = 'กำลังติดตาม'
  AND is_archived = false;

  -- Update the sales team member's current_leads
  UPDATE sales_team_with_user_info
  SET current_leads = lead_count,
      updated_at = now()
  WHERE id = sales_member_id;

  RETURN COALESCE(lead_count, 0);
END;
$function$;

-- =============================================================================
-- หมายเหตุ:
-- - Function นี้ถูกเรียกใช้จาก update_all_sales_team_current_leads_v2()
-- - ต้องแก้ไขเพื่อให้ current_leads นับรวม post_sales_owner_id
-- - TypeScript function updateSalesTeamCurrentLeads() แก้ไขแล้ว (Phase 5)
-- =============================================================================

