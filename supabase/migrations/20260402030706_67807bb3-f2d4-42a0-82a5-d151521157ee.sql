ALTER TABLE public.invoice_column_settings 
  ADD COLUMN font_size integer NOT NULL DEFAULT 11,
  ADD COLUMN alignment text NOT NULL DEFAULT 'left';