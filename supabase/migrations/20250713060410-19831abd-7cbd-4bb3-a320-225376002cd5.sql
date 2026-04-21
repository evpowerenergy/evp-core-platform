
-- Phase 1: Database Optimization
-- Add performance indexes for better query performance

-- Add composite indexes for common query patterns on leads table
CREATE INDEX IF NOT EXISTS idx_leads_created_at_desc ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_operation_status_created_at ON leads(operation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_category_platform_created_at ON leads(category, platform, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status_created_at_desc ON leads(status, created_at DESC);

-- Add indexes for sales team queries
CREATE INDEX IF NOT EXISTS idx_sales_team_user_id_status ON sales_team(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_team_status_active ON sales_team(status) WHERE status = 'active';

-- Add indexes for productivity logs
CREATE INDEX IF NOT EXISTS idx_productivity_logs_lead_id_created_at ON lead_productivity_logs(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_productivity_logs_staff_id_created_at ON lead_productivity_logs(staff_id, created_at DESC);

-- Optimize the trigger function for better performance
CREATE OR REPLACE FUNCTION public.update_lead_status_automatically()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only update if necessary fields have changed or it's an INSERT
  IF TG_OP = 'INSERT' OR 
     OLD.sale_owner_id IS DISTINCT FROM NEW.sale_owner_id OR 
     OLD.operation_status IS DISTINCT FROM NEW.operation_status THEN
    
    -- If no sale owner assigned, status should be 'รอรับ'
    IF NEW.sale_owner_id IS NULL THEN
      NEW.status := 'รอรับ';
    -- If operation_status is 'ปิดการขายแล้ว', lead_status should be 'ปิดการขาย'
    ELSIF NEW.operation_status = 'ปิดการขายแล้ว' THEN
      NEW.status := 'ปิดการขาย';
    -- If operation_status is 'ปิดการขายไม่สำเร็จ', lead_status should be 'ยังปิดการขายไม่สำเร็จ'
    ELSIF NEW.operation_status = 'ปิดการขายไม่สำเร็จ' THEN
      NEW.status := 'ยังปิดการขายไม่สำเร็จ';
    -- For all other operation_status values with assigned sale owner, status should be 'กำลังติดตาม'
    ELSIF NEW.sale_owner_id IS NOT NULL THEN
      NEW.status := 'กำลังติดตาม';
    END IF;
    
    -- Only update timestamp if status actually changed
    IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status THEN
      NEW.updated_at := now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add partial indexes for better performance on active records
CREATE INDEX IF NOT EXISTS idx_leads_active_not_archived ON leads(id, status, created_at DESC) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_leads_package_category ON leads(id, status, platform, created_at DESC) WHERE category = 'Package';

-- Analyze tables to update statistics after creating indexes
ANALYZE leads;
ANALYZE sales_team;
ANALYZE lead_productivity_logs;
