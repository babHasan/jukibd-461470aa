ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payable_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receive_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS receive_type text DEFAULT 'Cash',
  ADD COLUMN IF NOT EXISTS delivery_date text;