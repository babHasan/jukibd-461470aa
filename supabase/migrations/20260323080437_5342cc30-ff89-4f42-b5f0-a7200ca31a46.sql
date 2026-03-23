ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS created_by_name text NOT NULL DEFAULT '';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS delivered_by_name text NOT NULL DEFAULT '';