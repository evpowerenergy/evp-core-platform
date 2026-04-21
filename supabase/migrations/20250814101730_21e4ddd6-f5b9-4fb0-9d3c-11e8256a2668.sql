-- ===== ปรับปรุง products table =====
ALTER TABLE public.products 
ADD COLUMN is_serialized boolean DEFAULT true;

-- ===== สร้าง ENUM types =====
CREATE TYPE public.inventory_status AS ENUM ('in_stock', 'reserved', 'sold', 'returned', 'damaged');
CREATE TYPE public.customer_status AS ENUM ('active', 'inactive');
CREATE TYPE public.movement_type AS ENUM ('IN', 'OUT');
CREATE TYPE public.doc_type AS ENUM ('QT', 'BL', 'INV');

-- ===== สร้าง customers table =====
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id integer UNIQUE REFERENCES public.leads(id),
  name text NOT NULL,
  tel text,
  email text,
  platform text,
  sale_owner_id integer REFERENCES public.sales_team_with_user_info(id),
  status customer_status DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ===== สร้าง suppliers table =====
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  tax_id text,
  contact_person text,
  phone text,
  email text,
  address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ===== สร้าง purchase_orders table =====
CREATE TABLE public.purchase_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number text NOT NULL,
  po_date date NOT NULL DEFAULT CURRENT_DATE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id),
  note text,
  total_amount numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (po_number, supplier_id)
);

-- ===== สร้าง purchase_order_items table =====
CREATE TABLE public.purchase_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id integer NOT NULL REFERENCES public.products(id),
  qty integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total_price numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (purchase_order_id, product_id)
);

-- ===== สร้าง inventory_units table =====
CREATE TABLE public.inventory_units (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id integer NOT NULL REFERENCES public.products(id),
  serial_no text NOT NULL,
  purchase_order_item_id uuid REFERENCES public.purchase_order_items(id),
  status inventory_status DEFAULT 'in_stock',
  received_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (product_id, serial_no)
);

-- ===== สร้าง sales_docs table =====
CREATE TABLE public.sales_docs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_type doc_type NOT NULL,
  doc_number text NOT NULL,
  doc_date date NOT NULL DEFAULT CURRENT_DATE,
  customer_id uuid REFERENCES public.customers(id),
  salesperson_id uuid REFERENCES public.users(id),
  note text,
  total_amount numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (doc_type, doc_number)
);

-- ===== สร้าง sales_doc_items table =====
CREATE TABLE public.sales_doc_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_doc_id uuid NOT NULL REFERENCES public.sales_docs(id) ON DELETE CASCADE,
  product_id integer NOT NULL REFERENCES public.products(id),
  qty integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total_price numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- ===== สร้าง sales_doc_item_units table =====
CREATE TABLE public.sales_doc_item_units (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_doc_item_id uuid NOT NULL REFERENCES public.sales_doc_items(id) ON DELETE CASCADE,
  inventory_unit_id uuid NOT NULL REFERENCES public.inventory_units(id),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (inventory_unit_id)
);

-- ===== สร้าง stock_movements table =====
CREATE TABLE public.stock_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id integer NOT NULL REFERENCES public.products(id),
  movement movement_type NOT NULL,
  qty integer NOT NULL,
  ref_table text,
  ref_id uuid,
  note text,
  created_at timestamp with time zone DEFAULT now()
);

-- ===== สร้าง Indexes สำหรับ Performance =====
CREATE INDEX idx_inventory_units_product_status ON public.inventory_units(product_id, status);
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_customers_lead_id ON public.customers(lead_id);

-- ===== สร้าง Triggers สำหรับ updated_at =====
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_units_updated_at
  BEFORE UPDATE ON public.inventory_units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_docs_updated_at
  BEFORE UPDATE ON public.sales_docs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===== สร้าง Trigger คำนวณ total_price ใน purchase_order_items =====
CREATE OR REPLACE FUNCTION public.calculate_po_item_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.total_price := NEW.qty * NEW.unit_price;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER calculate_po_item_totals_trigger
  BEFORE INSERT OR UPDATE ON public.purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_po_item_totals();

-- ===== สร้าง Trigger คำนวณ total_price ใน sales_doc_items =====
CREATE OR REPLACE FUNCTION public.calculate_sales_item_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.total_price := NEW.qty * NEW.unit_price;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER calculate_sales_item_totals_trigger
  BEFORE INSERT OR UPDATE ON public.sales_doc_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_sales_item_totals();

-- ===== สร้าง Trigger อัปเดตสต็อกเมื่อรับสินค้าเข้า =====
CREATE OR REPLACE FUNCTION public.handle_inventory_in()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'in_stock' THEN
    -- เพิ่ม stock movement
    INSERT INTO public.stock_movements (product_id, movement, qty, ref_table, ref_id, note)
    VALUES (NEW.product_id, 'IN', 1, 'inventory_units', NEW.id, 'Received: ' || NEW.serial_no);
    
    -- อัปเดต products stock
    UPDATE public.products 
    SET 
      stock_total = stock_total + 1,
      stock_available = stock_available + 1,
      updated_at = now()
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER handle_inventory_in_trigger
  AFTER INSERT ON public.inventory_units
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_inventory_in();

-- ===== สร้าง Trigger อัปเดตสต็อกเมื่อขายสินค้าออก =====
CREATE OR REPLACE FUNCTION public.handle_inventory_out()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != 'sold' AND NEW.status = 'sold' THEN
    -- เพิ่ม stock movement
    INSERT INTO public.stock_movements (product_id, movement, qty, ref_table, ref_id, note)
    VALUES (NEW.product_id, 'OUT', 1, 'inventory_units', NEW.id, 'Sold: ' || NEW.serial_no);
    
    -- อัปเดต products stock
    UPDATE public.products 
    SET 
      stock_available = stock_available - 1,
      updated_at = now()
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER handle_inventory_out_trigger
  AFTER UPDATE ON public.inventory_units
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_inventory_out();

-- ===== สร้าง Trigger ซิงก์ customers จาก leads =====
CREATE OR REPLACE FUNCTION public.sync_customers_from_leads()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'ปิดการขาย' AND (OLD.status IS NULL OR OLD.status != 'ปิดการขาย') THEN
    -- สร้าง/อัปเดต customer เป็น active
    INSERT INTO public.customers (lead_id, name, tel, email, platform, sale_owner_id, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.full_name, NEW.display_name, 'Unknown'),
      NEW.tel,
      NEW.email,
      NEW.platform,
      NEW.sale_owner_id,
      'active'
    )
    ON CONFLICT (lead_id) DO UPDATE SET
      name = EXCLUDED.name,
      tel = EXCLUDED.tel,
      email = EXCLUDED.email,
      platform = EXCLUDED.platform,
      sale_owner_id = EXCLUDED.sale_owner_id,
      status = 'active',
      updated_at = now();
      
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'ปิดการขาย' AND NEW.status != 'ปิดการขาย' THEN
    -- เปลี่ยน customer เป็น inactive
    UPDATE public.customers 
    SET status = 'inactive', updated_at = now()
    WHERE lead_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER sync_customers_from_leads_trigger
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_customers_from_leads();

-- ===== เปิด RLS และสร้าง Policies ให้ทุก role CRUD ได้ =====

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_doc_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_doc_item_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to do everything on all tables
CREATE POLICY "Allow all CRUD for authenticated users" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all CRUD for authenticated users" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all CRUD for authenticated users" ON public.purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all CRUD for authenticated users" ON public.purchase_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all CRUD for authenticated users" ON public.inventory_units FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all CRUD for authenticated users" ON public.sales_docs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all CRUD for authenticated users" ON public.sales_doc_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all CRUD for authenticated users" ON public.sales_doc_item_units FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all CRUD for authenticated users" ON public.stock_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);