ALTER TABLE public.jobs 
ADD COLUMN service_charge numeric DEFAULT 0,
ADD COLUMN charge_type text DEFAULT 'Normal',
ADD COLUMN completed_date text;