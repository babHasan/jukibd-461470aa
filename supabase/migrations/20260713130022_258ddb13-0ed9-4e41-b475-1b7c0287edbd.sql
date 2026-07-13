CREATE OR REPLACE FUNCTION public.list_deleted_rows()
 RETURNS TABLE(table_name text, row_id uuid, label text, deleted_at timestamp with time zone, deleted_by uuid, deleted_by_name text, data jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  t text;
  label_expr text;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  FOR t IN SELECT unnest(ARRAY['jobs','clients','expenses','incomes','inventory','warranties','brands','models','boards','chart_of_accounts','branches','expense_categories','income_categories'])
  LOOP
    label_expr := CASE t
      WHEN 'jobs' THEN 'COALESCE(''JOB-'' || job_number::text, id::text)'
      WHEN 'clients' THEN 'COALESCE(company_name, name, mobile, id::text)'
      WHEN 'expenses' THEN 'COALESCE(description, id::text)'
      WHEN 'incomes' THEN 'COALESCE(description, id::text)'
      WHEN 'inventory' THEN 'COALESCE(name, id::text)'
      WHEN 'warranties' THEN 'COALESCE(id::text)'
      WHEN 'brands' THEN 'COALESCE(name, id::text)'
      WHEN 'models' THEN 'COALESCE(name, id::text)'
      WHEN 'boards' THEN 'COALESCE(name, id::text)'
      WHEN 'chart_of_accounts' THEN 'COALESCE(account_name, id::text)'
      WHEN 'branches' THEN 'COALESCE(name, id::text)'
      WHEN 'expense_categories' THEN 'COALESCE(name, id::text)'
      WHEN 'income_categories' THEN 'COALESCE(name, id::text)'
      ELSE 'id::text'
    END;

    RETURN QUERY EXECUTE format(
      'SELECT %L::text, id, (%s)::text, deleted_at, deleted_by,
              (SELECT name FROM public.profiles WHERE id = t.deleted_by),
              to_jsonb(t)
         FROM public.%I t
        WHERE deleted_at IS NOT NULL',
      t, label_expr, t
    );
  END LOOP;
END $function$;