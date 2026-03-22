
CREATE TABLE public.company_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  mobile text NOT NULL DEFAULT '',
  logo_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read company_info" ON public.company_info
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage company_info" ON public.company_info
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert a default row
INSERT INTO public.company_info (company_name) VALUES ('');
