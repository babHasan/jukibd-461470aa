
-- Remove the overly broad public policy
DROP POLICY IF EXISTS "Public can lookup email by mobile" ON public.profiles;

-- Create a secure function for mobile lookup (only returns email, nothing else)
CREATE OR REPLACE FUNCTION public.lookup_email_by_mobile(_mobile text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE mobile = _mobile LIMIT 1
$$;
