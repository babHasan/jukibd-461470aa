-- Add cheque_url column to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS cheque_url text;

-- Create cheques storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cheques', 'cheques', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload cheque photos
CREATE POLICY "Authenticated can upload cheques"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cheques');

-- Allow authenticated users to read cheque photos
CREATE POLICY "Authenticated can read cheques"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cheques');

-- Allow public read for cheque photos
CREATE POLICY "Public can read cheques"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'cheques');