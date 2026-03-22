CREATE TABLE public.sms_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key text NOT NULL DEFAULT '',
  sender_id text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sms_config" ON public.sms_config FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert a default row
INSERT INTO public.sms_config (api_key, sender_id) VALUES ('', '');