
-- Helper: super admin check (uses ::text to avoid enum-value tx issue)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = 'super_admin'
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM anon;

-- Add deleted_at / deleted_by to targeted tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['jobs','clients','expenses','incomes','inventory','warranties','brands','models','boards','chart_of_accounts','branches','expense_categories','income_categories']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_at timestamptz', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_by uuid', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (deleted_at)', t || '_deleted_at_idx', t);
  END LOOP;
END $$;

-- BEFORE DELETE trigger: soft-delete unless super-admin forces purge via GUC
CREATE OR REPLACE FUNCTION public.soft_delete_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  force text;
  uid uuid;
BEGIN
  force := current_setting('app.force_purge', true);
  IF force = 'true' THEN
    RETURN OLD;
  END IF;

  BEGIN
    uid := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    uid := NULL;
  END;

  EXECUTE format('UPDATE public.%I SET deleted_at = now(), deleted_by = $1 WHERE id = $2 AND deleted_at IS NULL', TG_TABLE_NAME)
    USING uid, OLD.id;
  RETURN NULL; -- cancel actual DELETE
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['jobs','clients','expenses','incomes','inventory','warranties','brands','models','boards','chart_of_accounts','branches','expense_categories','income_categories']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_soft_delete ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_soft_delete BEFORE DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.soft_delete_trigger()', t);
  END LOOP;
END $$;

-- Hide deleted rows from every SELECT unless the caller is super_admin.
-- Applied as an additional RESTRICTIVE policy so it AND-combines with existing policies.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['jobs','clients','expenses','incomes','inventory','warranties','brands','models','boards','chart_of_accounts','branches','expense_categories','income_categories']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "hide_soft_deleted" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "hide_soft_deleted" ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (deleted_at IS NULL OR public.is_super_admin(auth.uid()))',
      t
    );
    EXECUTE format('DROP POLICY IF EXISTS "hide_soft_deleted_upd" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "hide_soft_deleted_upd" ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (deleted_at IS NULL OR public.is_super_admin(auth.uid()))',
      t
    );
  END LOOP;
END $$;

-- List every deleted row across the tracked tables (super_admin only)
CREATE OR REPLACE FUNCTION public.list_deleted_rows()
RETURNS TABLE (
  table_name text,
  row_id uuid,
  label text,
  deleted_at timestamptz,
  deleted_by uuid,
  deleted_by_name text,
  data jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
      WHEN 'jobs' THEN 'COALESCE(''JOB-'' || ticket_number::text, id::text)'
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
END $$;

REVOKE EXECUTE ON FUNCTION public.list_deleted_rows() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.list_deleted_rows() TO authenticated;

-- Restore a soft-deleted row
CREATE OR REPLACE FUNCTION public.restore_deleted_row(_table text, _id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _table NOT IN ('jobs','clients','expenses','incomes','inventory','warranties','brands','models','boards','chart_of_accounts','branches','expense_categories','income_categories') THEN
    RAISE EXCEPTION 'Invalid table';
  END IF;
  EXECUTE format('UPDATE public.%I SET deleted_at = NULL, deleted_by = NULL WHERE id = $1', _table) USING _id;
END $$;

REVOKE EXECUTE ON FUNCTION public.restore_deleted_row(text, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.restore_deleted_row(text, uuid) TO authenticated;

-- Permanently purge a row (bypass soft-delete trigger)
CREATE OR REPLACE FUNCTION public.purge_deleted_row(_table text, _id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _table NOT IN ('jobs','clients','expenses','incomes','inventory','warranties','brands','models','boards','chart_of_accounts','branches','expense_categories','income_categories') THEN
    RAISE EXCEPTION 'Invalid table';
  END IF;
  PERFORM set_config('app.force_purge', 'true', true);
  EXECUTE format('DELETE FROM public.%I WHERE id = $1', _table) USING _id;
  PERFORM set_config('app.force_purge', 'false', true);
END $$;

REVOKE EXECUTE ON FUNCTION public.purge_deleted_row(text, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.purge_deleted_row(text, uuid) TO authenticated;
