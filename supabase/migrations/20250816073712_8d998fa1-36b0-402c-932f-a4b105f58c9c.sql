-- Add Thailand timezone fields to inventory management tables

-- Add created_at_thai and updated_at_thai to suppliers
ALTER TABLE public.suppliers 
ADD COLUMN created_at_thai TIMESTAMP WITH TIME ZONE,
ADD COLUMN updated_at_thai TIMESTAMP WITH TIME ZONE;

-- Add created_at_thai and updated_at_thai to purchase_orders  
ALTER TABLE public.purchase_orders
ADD COLUMN created_at_thai TIMESTAMP WITH TIME ZONE,
ADD COLUMN updated_at_thai TIMESTAMP WITH TIME ZONE;

-- Add created_at_thai to purchase_order_items
ALTER TABLE public.purchase_order_items
ADD COLUMN created_at_thai TIMESTAMP WITH TIME ZONE;

-- Add created_at_thai and updated_at_thai to inventory_units
ALTER TABLE public.inventory_units
ADD COLUMN created_at_thai TIMESTAMP WITH TIME ZONE,
ADD COLUMN updated_at_thai TIMESTAMP WITH TIME ZONE;

-- Add created_at_thai to stock_movements
ALTER TABLE public.stock_movements
ADD COLUMN created_at_thai TIMESTAMP WITH TIME ZONE;

-- Update existing records with Thailand timezone (+7 hours)
UPDATE public.suppliers 
SET 
  created_at_thai = created_at + INTERVAL '7 hours',
  updated_at_thai = updated_at + INTERVAL '7 hours'
WHERE created_at_thai IS NULL;

UPDATE public.purchase_orders 
SET 
  created_at_thai = created_at + INTERVAL '7 hours',
  updated_at_thai = updated_at + INTERVAL '7 hours'
WHERE created_at_thai IS NULL;

UPDATE public.purchase_order_items 
SET created_at_thai = created_at + INTERVAL '7 hours'
WHERE created_at_thai IS NULL;

UPDATE public.inventory_units 
SET 
  created_at_thai = created_at + INTERVAL '7 hours',
  updated_at_thai = updated_at + INTERVAL '7 hours'
WHERE created_at_thai IS NULL;

UPDATE public.stock_movements 
SET created_at_thai = created_at + INTERVAL '7 hours'
WHERE created_at_thai IS NULL;