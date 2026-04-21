
-- Add lead_id column to lead_products table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lead_products' AND column_name = 'lead_id') THEN
        ALTER TABLE public.lead_products ADD COLUMN lead_id integer;
        
        -- Add foreign key constraint
        ALTER TABLE public.lead_products 
        ADD CONSTRAINT fk_lead_products_lead_id 
        FOREIGN KEY (lead_id) REFERENCES public.leads(id);
        
        -- Create index for better performance
        CREATE INDEX idx_lead_products_lead_id ON public.lead_products(lead_id);
    END IF;
END $$;

-- Update existing lead_products records to link them with leads through productivity_log_id
UPDATE public.lead_products 
SET lead_id = (
    SELECT lpl.lead_id 
    FROM public.lead_productivity_logs lpl 
    WHERE lpl.id = lead_products.productivity_log_id
)
WHERE lead_id IS NULL AND productivity_log_id IS NOT NULL;

-- Add RLS policy for lead_products with lead_id
DROP POLICY IF EXISTS "Users can manage lead products for assigned leads" ON public.lead_products;

CREATE POLICY "Users can manage lead products for assigned leads"
ON public.lead_products
FOR ALL
USING (
    -- Admin/Manager can access all
    EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.auth_user_id = auth.uid() 
        AND u.role IN ('admin', 'manager')
    )
    OR
    -- Sales can access products for their assigned leads
    (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role = 'sale'
        )
        AND lead_id IN (
            SELECT l.id 
            FROM public.leads l
            JOIN public.sales_team st ON l.sale_owner_id = st.id
            JOIN public.users u ON st.user_id = u.id
            WHERE u.auth_user_id = auth.uid()
        )
    )
);

-- Allow DELETE operations on lead_products
CREATE POLICY "Allow delete for lead products" 
ON public.lead_products 
FOR DELETE 
USING (
    -- Admin/Manager can delete all
    EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.auth_user_id = auth.uid() 
        AND u.role IN ('admin', 'manager')
    )
    OR
    -- Sales can delete products for their assigned leads
    (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role = 'sale'
        )
        AND lead_id IN (
            SELECT l.id 
            FROM public.leads l
            JOIN public.sales_team st ON l.sale_owner_id = st.id
            JOIN public.users u ON st.user_id = u.id
            WHERE u.auth_user_id = auth.uid()
        )
    )
);
