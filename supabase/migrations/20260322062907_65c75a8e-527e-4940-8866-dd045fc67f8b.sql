
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Allow authenticated users to upload avatars
CREATE POLICY "Admins can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin')
);

-- Allow authenticated users to update avatars
CREATE POLICY "Admins can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin')
);

-- Allow public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow admins to delete avatars
CREATE POLICY "Admins can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin')
);
