DROP POLICY "Authenticated can insert jobs" ON public.jobs;
CREATE POLICY "Authenticated can insert own jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());