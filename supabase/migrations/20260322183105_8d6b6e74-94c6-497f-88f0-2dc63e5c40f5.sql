
CREATE TABLE public.theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_color text NOT NULL DEFAULT '#1e3a5f',
  sidebar_bg_color text NOT NULL DEFAULT '#0f1c2e',
  page_bg_color text NOT NULL DEFAULT '#f4f6f8',
  menu_font_size integer NOT NULL DEFAULT 13,
  menu_font_color text NOT NULL DEFAULT '#94a3b8',
  submenu_font_size integer NOT NULL DEFAULT 12,
  submenu_font_color text NOT NULL DEFAULT '#94a3b8',
  table_font_size integer NOT NULL DEFAULT 14,
  table_font_color text NOT NULL DEFAULT '#1e293b',
  table_header_bg_color text NOT NULL DEFAULT '#f1f5f9',
  table_header_font_color text NOT NULL DEFAULT '#334155',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage theme_settings" ON public.theme_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read theme_settings" ON public.theme_settings
  FOR SELECT TO authenticated, anon
  USING (true);

INSERT INTO public.theme_settings (id) VALUES (gen_random_uuid());
