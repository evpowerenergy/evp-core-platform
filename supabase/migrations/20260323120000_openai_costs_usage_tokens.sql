-- OpenAI sync: เก็บ token + แหล่งที่มา (costs API vs usage completions fallback)
ALTER TABLE public.openai_costs
  ADD COLUMN IF NOT EXISTS input_tokens bigint,
  ADD COLUMN IF NOT EXISTS output_tokens bigint,
  ADD COLUMN IF NOT EXISTS sync_source text;

COMMENT ON COLUMN public.openai_costs.input_tokens IS 'รวม input tokens ต่อวัน (จาก usage/completions เมื่อ sync)';
COMMENT ON COLUMN public.openai_costs.output_tokens IS 'รวม output tokens ต่อวัน (จาก usage/completions เมื่อ sync)';
COMMENT ON COLUMN public.openai_costs.sync_source IS 'costs_api | usage_completions_api';
