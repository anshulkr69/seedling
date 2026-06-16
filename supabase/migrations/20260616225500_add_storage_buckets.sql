-- Seedling Storage Buckets Setup
-- Target Environment: Supabase (PostgreSQL)

-- ────────────────────────────────────────────────────────
-- 1. Create Buckets
-- ────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('compliance-documents', 'compliance-documents', false, null, null),
  ('project-assets', 'project-assets', false, null, null)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────
-- 2. Storage Policies for "compliance-documents"
-- ────────────────────────────────────────────────────────

CREATE POLICY "Allow users to read their own compliance documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'compliance-documents' AND 
  auth.uid() IN (
    SELECT user_id FROM public.organizations 
    WHERE id = ((storage.foldername(name))[1])::uuid
  )
);

CREATE POLICY "Allow users to upload their own compliance documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'compliance-documents' AND 
  auth.uid() IN (
    SELECT user_id FROM public.organizations 
    WHERE id = ((storage.foldername(name))[1])::uuid
  )
);

CREATE POLICY "Allow users to update their own compliance documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'compliance-documents' AND 
  auth.uid() IN (
    SELECT user_id FROM public.organizations 
    WHERE id = ((storage.foldername(name))[1])::uuid
  )
)
WITH CHECK (
  bucket_id = 'compliance-documents' AND 
  auth.uid() IN (
    SELECT user_id FROM public.organizations 
    WHERE id = ((storage.foldername(name))[1])::uuid
  )
);

CREATE POLICY "Allow users to delete their own compliance documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'compliance-documents' AND 
  auth.uid() IN (
    SELECT user_id FROM public.organizations 
    WHERE id = ((storage.foldername(name))[1])::uuid
  )
);

-- ────────────────────────────────────────────────────────
-- 3. Storage Policies for "project-assets"
-- ────────────────────────────────────────────────────────

CREATE POLICY "Allow users to read their own project assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-assets' AND 
  auth.uid() IN (
    SELECT user_id FROM public.organizations 
    WHERE id = ((storage.foldername(name))[1])::uuid
  )
);

CREATE POLICY "Allow users to upload their own project assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-assets' AND 
  auth.uid() IN (
    SELECT user_id FROM public.organizations 
    WHERE id = ((storage.foldername(name))[1])::uuid
  )
);

CREATE POLICY "Allow users to update their own project assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-assets' AND 
  auth.uid() IN (
    SELECT user_id FROM public.organizations 
    WHERE id = ((storage.foldername(name))[1])::uuid
  )
)
WITH CHECK (
  bucket_id = 'project-assets' AND 
  auth.uid() IN (
    SELECT user_id FROM public.organizations 
    WHERE id = ((storage.foldername(name))[1])::uuid
  )
);

CREATE POLICY "Allow users to delete their own project assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-assets' AND 
  auth.uid() IN (
    SELECT user_id FROM public.organizations 
    WHERE id = ((storage.foldername(name))[1])::uuid
  )
);
