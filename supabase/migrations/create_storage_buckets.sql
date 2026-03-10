-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,          -- public bucket, avatars are readable by anyone
  5242880,       -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- RLS: users can only upload to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: anyone can read avatars (public bucket)
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
