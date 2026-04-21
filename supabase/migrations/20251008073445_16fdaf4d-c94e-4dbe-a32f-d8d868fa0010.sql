-- Create service_appointments table for managing service visit schedules
CREATE TABLE IF NOT EXISTS service_appointments (
  id SERIAL PRIMARY KEY,
  customer_service_id INTEGER NOT NULL REFERENCES customer_services(id) ON DELETE CASCADE,
  appointment_date TIMESTAMPTZ NOT NULL,
  appointment_date_thai TIMESTAMPTZ,
  appointment_time TIME,
  technician_name TEXT,
  service_type TEXT CHECK (service_type IN ('visit_1', 'visit_2')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
  notes TEXT,
  estimated_duration_minutes INTEGER DEFAULT 120,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at_thai TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok'),
  updated_at_thai TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_appointments_date ON service_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_service_appointments_customer ON service_appointments(customer_service_id);
CREATE INDEX IF NOT EXISTS idx_service_appointments_technician ON service_appointments(technician_name);
CREATE INDEX IF NOT EXISTS idx_service_appointments_status ON service_appointments(status);

-- Enable RLS
ALTER TABLE service_appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to view appointments"
  ON service_appointments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create appointments"
  ON service_appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update appointments"
  ON service_appointments
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete appointments"
  ON service_appointments
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updated_at_thai
CREATE OR REPLACE FUNCTION update_service_appointments_thai_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_at_thai = NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_appointments_updated_at_thai
  BEFORE UPDATE ON service_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_service_appointments_thai_timestamp();

-- Add comment
COMMENT ON TABLE service_appointments IS 'Service appointment scheduling for customer service visits';