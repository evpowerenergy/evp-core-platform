-- Function to calculate lead_products values
CREATE OR REPLACE FUNCTION calculate_lead_product_values()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate total_price
    NEW.total_price = COALESCE(NEW.quantity, 0) * COALESCE(NEW.unit_price, 0);
    
    -- Get cost_price from products table if not provided
    IF NEW.cost_price IS NULL THEN
        SELECT cost_price INTO NEW.cost_price 
        FROM products 
        WHERE id = NEW.product_id;
    END IF;
    
    -- Calculate total_cost
    NEW.total_cost = COALESCE(NEW.quantity, 0) * COALESCE(NEW.cost_price, 0);
    
    -- Calculate profit
    NEW.profit = COALESCE(NEW.total_price, 0) - COALESCE(NEW.total_cost, 0);
    
    -- Calculate profit_percent
    IF COALESCE(NEW.total_price, 0) > 0 THEN
        NEW.profit_percent = (COALESCE(NEW.profit, 0) / COALESCE(NEW.total_price, 0)) * 100;
    ELSE
        NEW.profit_percent = 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for lead_products table
DROP TRIGGER IF EXISTS trigger_calculate_lead_product_values ON lead_products;

CREATE TRIGGER trigger_calculate_lead_product_values
    BEFORE INSERT OR UPDATE ON lead_products
    FOR EACH ROW
    EXECUTE FUNCTION calculate_lead_product_values();

-- Update existing records to calculate values
UPDATE lead_products 
SET 
    total_price = COALESCE(quantity, 0) * COALESCE(unit_price, 0),
    total_cost = COALESCE(quantity, 0) * COALESCE(cost_price, 0),
    profit = (COALESCE(quantity, 0) * COALESCE(unit_price, 0)) - (COALESCE(quantity, 0) * COALESCE(cost_price, 0)),
    profit_percent = CASE 
        WHEN COALESCE(quantity, 0) * COALESCE(unit_price, 0) > 0 
        THEN ((COALESCE(quantity, 0) * COALESCE(unit_price, 0)) - (COALESCE(quantity, 0) * COALESCE(cost_price, 0))) / (COALESCE(quantity, 0) * COALESCE(unit_price, 0)) * 100
        ELSE 0 
    END
WHERE total_price IS NULL OR total_cost IS NULL OR profit IS NULL OR profit_percent IS NULL; 