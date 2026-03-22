CREATE TABLE public.boards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  remarks text NOT NULL DEFAULT ''::text,
  image_url text DEFAULT NULL
);

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read boards" ON public.boards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage boards" ON public.boards FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));