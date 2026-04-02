
CREATE TABLE public.invoice_column_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_key text NOT NULL UNIQUE,
  column_label text NOT NULL,
  visible_in_delivery boolean NOT NULL DEFAULT true,
  visible_in_receive boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_column_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invoice_column_settings"
  ON public.invoice_column_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read invoice_column_settings"
  ON public.invoice_column_settings FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO public.invoice_column_settings (column_key, column_label, visible_in_delivery, visible_in_receive, display_order) VALUES
  ('sl', 'SL', true, true, 1),
  ('job_number', 'Job No.', true, true, 2),
  ('brand_name', 'Brand', true, true, 3),
  ('model_name', 'Model', true, true, 4),
  ('board_name', 'Board', true, true, 5),
  ('board_serial', 'Board S/N', true, true, 6),
  ('details_of_problem', 'Problem Details', false, true, 7),
  ('service_charge', 'Charge', true, false, 8),
  ('discount', 'Discount', true, false, 9),
  ('payable_amount', 'Payable', true, false, 10);
