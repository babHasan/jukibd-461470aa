CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  job_number text NOT NULL,
  brand_name text NOT NULL DEFAULT '',
  model_name text NOT NULL DEFAULT '',
  board_name text NOT NULL DEFAULT '',
  board_serial text NOT NULL DEFAULT '',
  details_of_problem text NOT NULL DEFAULT '',
  remarks text NOT NULL DEFAULT '',
  customer_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  customer_name text NOT NULL DEFAULT '',
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  branch_name text NOT NULL DEFAULT '',
  factory_challan_number text NOT NULL DEFAULT '',
  job_date date NOT NULL DEFAULT CURRENT_DATE,
  challan_url text,
  status text NOT NULL DEFAULT 'received',
  created_by uuid
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read jobs" ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage jobs" ON public.jobs FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));