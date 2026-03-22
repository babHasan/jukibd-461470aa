
CREATE TABLE public.portal_scroll_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_text text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_scroll_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage portal_scroll_messages"
  ON public.portal_scroll_messages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read active portal_scroll_messages"
  ON public.portal_scroll_messages FOR SELECT TO anon, authenticated
  USING (is_active = true);

INSERT INTO public.portal_scroll_messages (message_text, is_active)
VALUES ('Welcome to JUKIBD Service Center. Track your repair status here.', true);
