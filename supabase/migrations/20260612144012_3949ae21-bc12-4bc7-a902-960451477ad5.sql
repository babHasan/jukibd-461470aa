
-- Helper: check if a user has been granted a module permission
CREATE OR REPLACE FUNCTION public.has_module_permission(_user_id uuid, _module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND module = _module
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_module_permission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_module_permission(uuid, text) TO authenticated;

-- JOBS: restrict SELECT
DROP POLICY IF EXISTS "Authenticated can read jobs" ON public.jobs;
CREATE POLICY "Staff can read jobs" ON public.jobs
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR created_by = auth.uid()
    OR public.has_module_permission(auth.uid(), 'Job List')
  );

-- EXPENSES: restrict SELECT
DROP POLICY IF EXISTS "Authenticated can read expenses" ON public.expenses;
CREATE POLICY "Staff can read expenses" ON public.expenses
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR created_by = auth.uid()
    OR public.has_module_permission(auth.uid(), 'Expense / Income')
    OR public.has_module_permission(auth.uid(), 'Cashbook')
    OR public.has_module_permission(auth.uid(), 'Reports')
  );

-- INCOMES: restrict SELECT
DROP POLICY IF EXISTS "Authenticated can read incomes" ON public.incomes;
CREATE POLICY "Staff can read incomes" ON public.incomes
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR created_by = auth.uid()
    OR public.has_module_permission(auth.uid(), 'Expense / Income')
    OR public.has_module_permission(auth.uid(), 'Cashbook')
    OR public.has_module_permission(auth.uid(), 'Reports')
  );

-- INVENTORY: restrict SELECT
DROP POLICY IF EXISTS "Authenticated can read inventory" ON public.inventory;
CREATE POLICY "Staff can read inventory" ON public.inventory
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_module_permission(auth.uid(), 'Inventory')
  );

-- WARRANTIES: restrict SELECT
DROP POLICY IF EXISTS "Authenticated can read warranties" ON public.warranties;
CREATE POLICY "Staff can read warranties" ON public.warranties
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_module_permission(auth.uid(), 'Warranty')
  );

-- STORAGE: cheques bucket — scope to uploader's folder + permission
DROP POLICY IF EXISTS "Authenticated can upload cheques" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read cheques" ON storage.objects;

CREATE POLICY "Delivery staff can upload cheques to own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cheques'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_module_permission(auth.uid(), 'Delivery')
    )
  );

CREATE POLICY "Admins or uploader can read cheques" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'cheques'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR owner = auth.uid()
    )
  );
