
-- Fix: clients SELECT restricted to admins
DROP POLICY IF EXISTS "Authenticated can read clients" ON public.clients;
CREATE POLICY "Admins can read clients" ON public.clients
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix: sms_logs SELECT restricted to admins
DROP POLICY IF EXISTS "Authenticated can read sms_logs" ON public.sms_logs;
CREATE POLICY "Admins can read sms_logs" ON public.sms_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix: branches SELECT restricted to admins
DROP POLICY IF EXISTS "Authenticated users can read branches" ON public.branches;
CREATE POLICY "Admins can read branches" ON public.branches
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix: jobs UPDATE restricted to owner or admin
DROP POLICY IF EXISTS "Authenticated can update jobs" ON public.jobs;
CREATE POLICY "Owners or admins can update jobs" ON public.jobs
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- Fix: customer_feedback remove anon SELECT
DROP POLICY IF EXISTS "Anon can read own feedback" ON public.customer_feedback;

-- Fix: sms_templates restrict to authenticated only, active only
DROP POLICY IF EXISTS "Anyone can read active templates" ON public.sms_templates;
CREATE POLICY "Authenticated can read active templates" ON public.sms_templates
  FOR SELECT TO authenticated USING (is_active = true);

-- Fix: cheques bucket - remove anon SELECT
DROP POLICY IF EXISTS "Public can read cheques" ON storage.objects;

-- Fix: SECURITY DEFINER function exposure - revoke from anon/public where safe
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.lookup_email_by_mobile(text) FROM PUBLIC, authenticated;
