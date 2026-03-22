
-- Allow admins to delete roles and permissions
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete permissions"
  ON public.user_permissions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
