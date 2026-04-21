-- Migration: Add performance indexes for better query performance
-- Date: 2025-07-10

-- Add indexes for leads table
CREATE INDEX IF NOT EXISTS idx_leads_status_created_at ON leads(status, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_category_created_at ON leads(category, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_sale_owner_status ON leads(sale_owner_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_platform ON leads(platform);
CREATE INDEX IF NOT EXISTS idx_leads_region ON leads(region);
CREATE INDEX IF NOT EXISTS idx_leads_operation_status ON leads(operation_status);
CREATE INDEX IF NOT EXISTS idx_leads_is_archived ON leads(is_archived);

-- Add indexes for quotations table
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at);
CREATE INDEX IF NOT EXISTS idx_quotations_productivity_log_id ON quotations(productivity_log_id);
CREATE INDEX IF NOT EXISTS idx_quotations_total_amount ON quotations(total_amount);

-- Add indexes for lead_productivity_logs table
CREATE INDEX IF NOT EXISTS idx_productivity_logs_created_at ON lead_productivity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_productivity_logs_lead_id ON lead_productivity_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_productivity_logs_hotness ON lead_productivity_logs(hotness);
CREATE INDEX IF NOT EXISTS idx_productivity_logs_next_follow_up ON lead_productivity_logs(next_follow_up);

-- Add indexes for appointments table
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_productivity_log_id ON appointments(productivity_log_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Add indexes for sales_team table
CREATE INDEX IF NOT EXISTS idx_sales_team_user_id ON sales_team(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_team_status ON sales_team(status);

-- Add indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add indexes for products table
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_leads_category_status_created ON leads(category, status, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_sale_owner_category ON leads(sale_owner_id, category);
CREATE INDEX IF NOT EXISTS idx_leads_status_updated_at ON leads(status, updated_at);

-- Add indexes for date range queries
CREATE INDEX IF NOT EXISTS idx_leads_created_at_range ON leads(created_at) WHERE created_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotations_created_at_range ON quotations(created_at) WHERE created_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_productivity_logs_created_at_range ON lead_productivity_logs(created_at) WHERE created_at IS NOT NULL;

-- Add partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_leads_active ON leads(id, status, sale_owner_id) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_sales_team_active ON sales_team(id, status) WHERE status = 'active';

-- Add indexes for text search (if using full-text search)
-- CREATE INDEX IF NOT EXISTS idx_leads_full_name_gin ON leads USING gin(to_tsvector('thai', full_name));
-- CREATE INDEX IF NOT EXISTS idx_leads_display_name_gin ON leads USING gin(to_tsvector('thai', display_name));

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Analyze tables to update statistics
ANALYZE leads;
ANALYZE quotations;
ANALYZE lead_productivity_logs;
ANALYZE appointments;
ANALYZE sales_team;
ANALYZE users;
ANALYZE products; 