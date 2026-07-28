
CREATE POLICY "zestawbucket owners can select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'zestawbucket' AND owner = auth.uid());

CREATE POLICY "zestawbucket owners can insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'zestawbucket' AND owner = auth.uid());

CREATE POLICY "zestawbucket owners can update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'zestawbucket' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'zestawbucket' AND owner = auth.uid());

CREATE POLICY "zestawbucket owners can delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'zestawbucket' AND owner = auth.uid());
