
-- Allow admins to delete jobs
CREATE POLICY "Admins can delete jobs"
ON public.jobs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete clients
CREATE POLICY "Admins can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
