-- Add trigger to calculate appointment_date_thai automatically
CREATE OR REPLACE FUNCTION update_service_appointment_thai_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate appointment_date_thai from appointment_date
  IF NEW.appointment_date IS NOT NULL THEN
    NEW.appointment_date_thai := NEW.appointment_date + INTERVAL '7 hours';
  END IF;
  
  -- Update updated_at_thai
  IF NEW.updated_at IS NOT NULL THEN
    NEW.updated_at_thai := NEW.updated_at + INTERVAL '7 hours';
  END IF;
  
  -- Update created_at_thai (only on INSERT)
  IF TG_OP = 'INSERT' AND NEW.created_at IS NOT NULL THEN
    NEW.created_at_thai := NEW.created_at + INTERVAL '7 hours';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS service_appointment_thai_timestamp_trigger ON service_appointments;

-- Create trigger for service_appointments
CREATE TRIGGER service_appointment_thai_timestamp_trigger
  BEFORE INSERT OR UPDATE ON service_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_service_appointment_thai_timestamp();