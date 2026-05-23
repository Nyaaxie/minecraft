CREATE POLICY "Users can upload their own avatar"
 ON storage.objects FOR INSERT
 WITH CHECK (
   bucket_id = 'avatars' AND 
   (storage.foldername(name))[1] = auth.uid()::text
 );

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update their own avatar"
   ON storage.objects FOR UPDATE
   USING (
   bucket_id = 'avatars' AND 
     (storage.foldername(name))[1] = auth.uid()::text
   )
   WITH CHECK (
     bucket_id = 'avatars' AND 
     (storage.foldername(name))[1] = auth.uid()::text
   );

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
   ON storage.objects FOR DELETE
   USING (
     bucket_id = 'avatars' AND 
     (storage.foldername(name))[1] = auth.uid()::text
   );

-- Allow everyone to view avatars
CREATE POLICY "Avatars are viewable by everyone" ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');