
-- Fix sms_logs: restrict to authenticated users only
DROP POLICY IF EXISTS "Allow all access to sms_logs" ON public.sms_logs;
CREATE POLICY "Authenticated can read sms_logs"
  ON public.sms_logs FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Service can insert sms_logs"
  ON public.sms_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix sms_templates: restrict to admin
DROP POLICY IF EXISTS "Allow all access to sms_templates" ON public.sms_templates;
CREATE POLICY "Anyone can read active templates"
  ON public.sms_templates FOR SELECT
  USING (true);
CREATE POLICY "Admins can modify templates"
  ON public.sms_templates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
