-- อัพเดท function เพื่อรองรับตารางใหม่
CREATE OR REPLACE FUNCTION update_thailand_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle different table-specific columns
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
    
    ELSE
      -- Default behavior for leads and users (already handled by existing triggers)
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

-- สร้าง triggers สำหรับตารางใหม่
CREATE TRIGGER update_appointments_thai_time
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();

CREATE TRIGGER update_bookings_thai_time
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();

CREATE TRIGGER update_conversations_thai_time
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();

CREATE TRIGGER update_office_equipment_thai_time
  BEFORE INSERT OR UPDATE ON office_equipment
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();

CREATE TRIGGER update_platforms_thai_time
  BEFORE INSERT OR UPDATE ON platforms
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();

CREATE TRIGGER update_products_thai_time
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();

CREATE TRIGGER update_quotations_thai_time
  BEFORE INSERT OR UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();

CREATE TRIGGER update_resources_thai_time
  BEFORE INSERT OR UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();

CREATE TRIGGER update_sales_team_info_thai_time
  BEFORE INSERT OR UPDATE ON sales_team_with_user_info
  FOR EACH ROW EXECUTE FUNCTION update_thailand_timestamps();