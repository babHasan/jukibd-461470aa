
CREATE TABLE public.footer_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL DEFAULT '© 2026 JUKIBD. All rights reserved.',
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.footer_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage footer_content" ON public.footer_content
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read active footer_content" ON public.footer_content
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

INSERT INTO public.footer_content (content) VALUES ('© 2026 JUKIBD. All rights reserved.');
