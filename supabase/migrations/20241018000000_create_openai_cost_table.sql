-- Create table for storing OpenAI cost data
CREATE TABLE IF NOT EXISTS public.openai_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  cost_usd DECIMAL(10, 4) NOT NULL DEFAULT 0,
  cost_baht DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster date queries
CREATE INDEX IF NOT EXISTS idx_openai_costs_date ON public.openai_costs(date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.openai_costs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read
CREATE POLICY "Allow authenticated users to read openai_costs"
  ON public.openai_costs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow service role to insert/update
CREATE POLICY "Allow service role to insert/update openai_costs"
  ON public.openai_costs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment to table
COMMENT ON TABLE public.openai_costs IS 'Stores daily OpenAI API usage costs';

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_openai_costs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER update_openai_costs_updated_at_trigger
  BEFORE UPDATE ON public.openai_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_openai_costs_updated_at();

