DROP POLICY IF EXISTS "Authenticated users can upload care-swap media" ON storage.objects;

CREATE POLICY "Users upload care-swap media in own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'care-swap-media'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "Users update own care-swap media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'care-swap-media'
  AND (storage.foldername(name))[1] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'care-swap-media'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);