
CREATE TABLE public.chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code text NOT NULL DEFAULT '',
  account_name text NOT NULL,
  account_type text NOT NULL DEFAULT 'Asset',
  parent_id uuid REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage chart_of_accounts" ON public.chart_of_accounts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read chart_of_accounts" ON public.chart_of_accounts
  FOR SELECT TO authenticated
  USING (true);
