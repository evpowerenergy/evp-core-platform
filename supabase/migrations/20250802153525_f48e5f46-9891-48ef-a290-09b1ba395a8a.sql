-- Add foreign key constraint between leads.sale_owner_id and sales_team_with_user_info.id
-- This will improve data integrity and query performance

ALTER TABLE leads 
ADD CONSTRAINT fk_leads_sale_owner_id 
FOREIGN KEY (sale_owner_id) 
REFERENCES sales_team_with_user_info(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Add comment to document the relationship
COMMENT ON CONSTRAINT fk_leads_sale_owner_id ON leads IS 'Foreign key to sales_team_with_user_info.id for data integrity and query optimization';