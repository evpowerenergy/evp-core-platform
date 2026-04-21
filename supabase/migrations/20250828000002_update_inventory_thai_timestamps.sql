-- Extend Thailand timestamp handling for inventory tables

-- Ensure thai timestamp columns exist
ALTER TABLE public.inventory_serial_ledger
  ADD COLUMN IF NOT EXISTS created_at_thai timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at_thai timestamptz;

-- Re-create generic function with additional table support
CREATE OR REPLACE FUNCTION update_thailand_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'appointments' THEN
      IF NEW.date IS NOT NULL THEN
        NEW.date_thai := NEW.date + INTERVAL '7 hours';
      END IF;

    WHEN 'bookings' THEN
      IF NEW.created_at IS NOT NULL THEN
        NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
      END IF;
      IF NEW.start_time IS NOT NULL THEN
        NEW.start_time_thai := NEW.start_time + INTERVAL '7 hours';
      END IF;
      IF NEW.end_time IS NOT NULL THEN
        NEW.end_time_thai := NEW.end_time + INTERVAL '7 hours';
      END IF;

    WHEN 'conversations' THEN
      IF NEW.created_at IS NOT NULL THEN
        NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
      END IF;

    WHEN 'lead_productivity_logs' THEN
      IF NEW.created_at IS NOT NULL THEN
        NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
      END IF;
      IF NEW.next_follow_up IS NOT NULL THEN
        NEW.next_follow_up_thai := NEW.next_follow_up + INTERVAL '7 hours';
      END IF;

    WHEN 'office_equipment' THEN
      IF NEW.created_at IS NOT NULL THEN
        NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
      END IF;
      IF NEW.updated_at IS NOT NULL THEN
        NEW.updated_at_thai := NEW.updated_at + INTERVAL '7 hours';
      END IF;

    WHEN 'platforms' THEN
      IF NEW.created_at IS NOT NULL THEN
        NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
      END IF;
      IF NEW.updated_at IS NOT NULL THEN
        NEW.updated_at_thai := NEW.updated_at + INTERVAL '7 hours';
      END IF;

    WHEN 'products' THEN
      IF NEW.created_at IS NOT NULL THEN
        NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
      END IF;
      IF NEW.updated_at IS NOT NULL THEN
        NEW.updated_at_thai := NEW.updated_at + INTERVAL '7 hours';
      END IF;

    WHEN 'quotation_documents' THEN
      IF NEW.created_at IS NOT NULL THEN
        NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
      END IF;

    WHEN 'quotations' THEN
      IF NEW.estimate_payment_date IS NOT NULL THEN
        NEW.estimate_payment_date_thai := NEW.estimate_payment_date + INTERVAL '7 hours';
      END IF;

    WHEN 'resources' THEN
      IF NEW.created_at IS NOT NULL THEN
        NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
      END IF;

    WHEN 'sales_team_with_user_info' THEN
      IF NEW.created_at IS NOT NULL THEN
        NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
      END IF;
      IF NEW.updated_at IS NOT NULL THEN
        NEW.updated_at_thai := NEW.updated_at + INTERVAL '7 hours';
      END IF;

    WHEN 'purchase_orders' THEN
      IF NEW.created_at IS NOT NULL THEN
        NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
      END IF;
      IF NEW.updated_at IS NOT NULL THEN
        NEW.updated_at_thai := NEW.updated_at + INTERVAL '7 hours';
      END IF;

    WHEN 'purchase_order_items' THEN
      IF NEW.created_at IS NOT NULL THEN
        NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
      END IF;

    WHEN 'inventory_units' THEN
      IF NEW.created_at IS NOT NULL THEN
        NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
      END IF;
      IF NEW.updated_at IS NOT NULL THEN
        NEW.updated_at_thai := NEW.updated_at + INTERVAL '7 hours';
      END IF;

    WHEN 'suppliers' THEN
      IF NEW.created_at IS NOT NULL THEN
        NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
      END IF;
      IF NEW.updated_at IS NOT NULL THEN
        NEW.updated_at_thai := NEW.updated_at + INTERVAL '7 hours';
      END IF;

    WHEN 'inventory_serial_ledger' THEN
      IF NEW.created_at IS NOT NULL THEN
        NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
      END IF;
      IF NEW.updated_at IS NOT NULL THEN
        NEW.updated_at_thai := NEW.updated_at + INTERVAL '7 hours';
      END IF;

    ELSE
      IF NEW.created_at IS NOT NULL THEN
        NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
      END IF;

      IF TG_TABLE_NAME IN ('leads', 'users') AND NEW.updated_at IS NOT NULL THEN
        NEW.updated_at_thai := NEW.updated_at + INTERVAL '7 hours';
      END IF;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers for inventory-related tables
DROP TRIGGER IF EXISTS update_purchase_orders_thai_time ON public.purchase_orders;
CREATE TRIGGER update_purchase_orders_thai_time
  BEFORE INSERT OR UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();

DROP TRIGGER IF EXISTS update_purchase_order_items_thai_time ON public.purchase_order_items;
CREATE TRIGGER update_purchase_order_items_thai_time
  BEFORE INSERT OR UPDATE ON public.purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();

DROP TRIGGER IF EXISTS update_inventory_units_thai_time ON public.inventory_units;
CREATE TRIGGER update_inventory_units_thai_time
  BEFORE INSERT OR UPDATE ON public.inventory_units
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();

DROP TRIGGER IF EXISTS update_suppliers_thai_time ON public.suppliers;
CREATE TRIGGER update_suppliers_thai_time
  BEFORE INSERT OR UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();

DROP TRIGGER IF EXISTS update_inventory_serial_ledger_thai_time ON public.inventory_serial_ledger;
CREATE TRIGGER update_inventory_serial_ledger_thai_time
  BEFORE INSERT OR UPDATE ON public.inventory_serial_ledger
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();

-- Backfill existing data to ensure thai columns are populated
UPDATE public.purchase_orders
SET
  created_at_thai = CASE WHEN created_at IS NOT NULL THEN created_at + INTERVAL '7 hours' ELSE NULL END,
  updated_at_thai = CASE WHEN updated_at IS NOT NULL THEN updated_at + INTERVAL '7 hours' ELSE NULL END;

UPDATE public.purchase_order_items
SET
  created_at_thai = CASE WHEN created_at IS NOT NULL THEN created_at + INTERVAL '7 hours' ELSE NULL END;

UPDATE public.inventory_units
SET
  created_at_thai = CASE WHEN created_at IS NOT NULL THEN created_at + INTERVAL '7 hours' ELSE NULL END,
  updated_at_thai = CASE WHEN updated_at IS NOT NULL THEN updated_at + INTERVAL '7 hours' ELSE NULL END;

UPDATE public.suppliers
SET
  created_at_thai = CASE WHEN created_at IS NOT NULL THEN created_at + INTERVAL '7 hours' ELSE NULL END,
  updated_at_thai = CASE WHEN updated_at IS NOT NULL THEN updated_at + INTERVAL '7 hours' ELSE NULL END;

UPDATE public.inventory_serial_ledger
SET
  created_at_thai = CASE WHEN created_at IS NOT NULL THEN created_at + INTERVAL '7 hours' ELSE NULL END,
  updated_at_thai = CASE WHEN updated_at IS NOT NULL THEN updated_at + INTERVAL '7 hours' ELSE NULL END;

