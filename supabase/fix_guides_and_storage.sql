-- Ensure url column exists in guides table
-- (The user mentioned 'url' is the image field)
ALTER TABLE guides 
ADD COLUMN IF NOT EXISTS url TEXT;

-- Storage Policies for Admins to manage guides and other images
-- This allows admins to upload to any folder in the 'avatars' bucket
-- (Used by guides, shops, etc. in the current implementation)
CREATE POLICY "Admins can manage all objects"
ON storage.objects FOR ALL
USING (
  bucket_id = 'avatars' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
