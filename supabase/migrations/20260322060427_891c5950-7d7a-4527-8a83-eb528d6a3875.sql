
-- Allow anonymous lookup of email by mobile for login
CREATE POLICY "Public can lookup email by mobile"
  ON public.profiles FOR SELECT TO anon
  USING (true);
