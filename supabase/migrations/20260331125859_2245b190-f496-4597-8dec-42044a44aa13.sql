
-- Add images jsonb column to products for multiple images
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- Create storage bucket for pack images
INSERT INTO storage.buckets (id, name, public) VALUES ('pack-images', 'pack-images', true) ON CONFLICT DO NOTHING;

-- Allow anyone to read pack images
CREATE POLICY "Public read pack images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'pack-images');

-- Allow authenticated users to upload pack images (admin will upload)
CREATE POLICY "Auth upload pack images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pack-images');

-- Allow authenticated users to delete pack images
CREATE POLICY "Auth delete pack images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'pack-images');
