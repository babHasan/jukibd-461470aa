ALTER TABLE public.portal_scroll_messages
  ADD COLUMN font_size integer NOT NULL DEFAULT 14,
  ADD COLUMN font_color text NOT NULL DEFAULT '#FFFFFF';