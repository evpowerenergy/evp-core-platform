-- Fix sale_owner_id mapping after sales_team table removal
-- This migration updates leads.sale_owner_id to match the new sales_team_with_user_info.id

-- First, let's see the current mapping issue
-- leads.sale_owner_id references old sales_team.id which no longer exists
-- We need to map it to the new sales_team_with_user_info.id

-- Since we can't directly map old sales_team.id to new sales_team_with_user_info.id,
-- we need to update based on user relationships

-- For now, let's set sale_owner_id to NULL for all leads that reference non-existent sales team members
-- This will make them appear as "unassigned" leads that can be reassigned

UPDATE leads 
SET sale_owner_id = NULL, 
    status = 'รอรับ',
    updated_at = now()
WHERE sale_owner_id IS NOT NULL 
  AND sale_owner_id NOT IN (SELECT id FROM sales_team_with_user_info);

-- Add a comment to track this change
COMMENT ON COLUMN leads.sale_owner_id IS 'References sales_team_with_user_info.id - updated after sales_team table removal';