
-- 1. Inventory/Parts Management
CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_name text NOT NULL,
  part_number text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 0,
  min_stock_level integer NOT NULL DEFAULT 5,
  unit_price numeric NOT NULL DEFAULT 0,
  supplier text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  remarks text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inventory" ON public.inventory FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read inventory" ON public.inventory FOR SELECT TO authenticated
  USING (true);

-- 2. Warranty Tracking
CREATE TABLE public.warranties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  job_number text NOT NULL DEFAULT '',
  customer_name text NOT NULL DEFAULT '',
  warranty_start_date date NOT NULL DEFAULT CURRENT_DATE,
  warranty_end_date date NOT NULL,
  warranty_type text NOT NULL DEFAULT 'Standard',
  terms text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage warranties" ON public.warranties FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read warranties" ON public.warranties FOR SELECT TO authenticated
  USING (true);

-- 3. Customer Feedback
CREATE TABLE public.customer_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  job_number text NOT NULL DEFAULT '',
  customer_name text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 5,
  feedback_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feedback" ON public.customer_feedback FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert feedback" ON public.customer_feedback FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can read feedback" ON public.customer_feedback FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anon can read own feedback" ON public.customer_feedback FOR SELECT TO anon
  USING (true);
